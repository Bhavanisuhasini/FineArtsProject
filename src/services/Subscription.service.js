import { getPool, sql } from "../config/db.js";

/*
  SQL — run once in SSMS:

  -- Drop old constraint if it exists
  ALTER TABLE subscription_plans DROP CONSTRAINT IF EXISTS chk_plan_type;
  ALTER TABLE subscription_plans ADD CONSTRAINT chk_plan_type CHECK (plan_type = 'USER');
  UPDATE subscription_plans SET plan_type = 'USER' WHERE plan_type IN ('TRAINER','INSTITUTE');

  -- Add discount_percentage column if missing
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('subscription_plans') AND name = 'discount_percentage')
    ALTER TABLE subscription_plans ADD discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0;
*/

/* ── LIST PLANS (public) ────────────────────────────────────────────────── */
export const listPlansService = async () => {
  const pool = getPool();
  const result = await pool.request()
    .query(`
      SELECT id, name, description, price, duration_days,
             discount_percentage, features, is_active, created_at
      FROM subscription_plans
      WHERE is_active = 1 AND plan_type = 'USER'
      ORDER BY price ASC
    `);
  return result.recordset;
};

/* ── GET PLAN BY ID (public) ────────────────────────────────────────────── */
export const getPlanByIdService = async (planId) => {
  const pool = getPool();
  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(planId))
    .query(`
      SELECT id, name, description, price, duration_days,
             discount_percentage, features, is_active, created_at
      FROM subscription_plans
      WHERE id = @id AND plan_type = 'USER'
    `);
  if (result.recordset.length === 0) throw new Error("Plan not found");
  return result.recordset[0];
};

/* ── CREATE PLAN (admin only) ───────────────────────────────────────────── */
export const createPlanService = async (body) => {
  const pool = getPool();
  const { name, description, price, duration_days, discount_percentage, features } = body;

  if (!name?.trim())  throw new Error("Plan name is required");
  if (!price)         throw new Error("Plan price is required");
  if (!duration_days) throw new Error("Duration in days is required");

  const discount = parseFloat(discount_percentage || 0);
  if (discount < 0 || discount > 100) throw new Error("Discount percentage must be between 0 and 100");

  const result = await pool.request()
    .input("name",                sql.NVarChar(100),  name.trim())
    .input("description",         sql.NVarChar(500),  description || null)
    .input("price",               sql.Decimal(10, 2), parseFloat(price))
    .input("duration_days",       sql.Int,            parseInt(duration_days))
    .input("discount_percentage", sql.Decimal(5, 2),  discount)
    .input("features",            sql.NVarChar(1000), features || null)
    .query(`
      INSERT INTO subscription_plans
        (name, description, price, duration_days, plan_type, discount_percentage, features)
      OUTPUT INSERTED.*
      VALUES (@name, @description, @price, @duration_days, 'USER', @discount_percentage, @features)
    `);

  return result.recordset[0];
};

/* ── UPDATE PLAN (admin only) ───────────────────────────────────────────── */
export const updatePlanService = async (planId, body) => {
  const pool = getPool();
  const { name, description, price, duration_days, discount_percentage, features, is_active } = body;

  const existing = await pool.request()
    .input("id", sql.BigInt, parseInt(planId))
    .query(`SELECT * FROM subscription_plans WHERE id = @id AND plan_type = 'USER'`);

  if (existing.recordset.length === 0) throw new Error("Plan not found");
  const old = existing.recordset[0];

  const result = await pool.request()
    .input("id",                  sql.BigInt,        parseInt(planId))
    .input("name",                sql.NVarChar(100),  name          ?? old.name)
    .input("description",         sql.NVarChar(500),  description   ?? old.description)
    .input("price",               sql.Decimal(10, 2), price         ? parseFloat(price)       : old.price)
    .input("duration_days",       sql.Int,            duration_days ? parseInt(duration_days) : old.duration_days)
    .input("discount_percentage", sql.Decimal(5, 2),  discount_percentage !== undefined ? parseFloat(discount_percentage) : old.discount_percentage)
    .input("features",            sql.NVarChar(1000), features      ?? old.features)
    .input("is_active",           sql.Bit,            is_active !== undefined ? is_active : old.is_active)
    .query(`
      UPDATE subscription_plans SET
        name = @name, description = @description, price = @price,
        duration_days = @duration_days, discount_percentage = @discount_percentage,
        features = @features, is_active = @is_active
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  return result.recordset[0];
};

/* ── SUBSCRIBE (users only) ─────────────────────────────────────────────── */
export const subscribeToPlanService = async (accountId, planId, utrNumber) => {
  const pool = getPool();

  const accountCheck = await pool.request()
    .input("id", sql.BigInt, accountId)
    .query(`SELECT role FROM accounts WHERE id = @id`);

  if (accountCheck.recordset.length === 0) throw new Error("Account not found");
  const role = accountCheck.recordset[0].role;

  if (role === "TRAINER")   throw new Error("Trainers are partners of FineArts Academy and do not need a subscription");
  if (role === "INSTITUTE") throw new Error("Institutes are partners of FineArts Academy and do not need a subscription");
  if (role === "ADMIN")     throw new Error("Admins cannot subscribe to plans");

  const planResult = await pool.request()
    .input("id", sql.BigInt, parseInt(planId))
    .query(`SELECT * FROM subscription_plans WHERE id = @id AND is_active = 1 AND plan_type = 'USER'`);

  if (planResult.recordset.length === 0) throw new Error("Subscription plan not found or no longer available");
  const plan = planResult.recordset[0];

  // Cancel any existing active subscription
  await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`UPDATE user_subscriptions SET status = 'CANCELLED' WHERE account_id = @account_id AND status = 'ACTIVE'`);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.duration_days);

  const result = await pool.request()
    .input("account_id",  sql.BigInt,        accountId)
    .input("plan_id",     sql.BigInt,        plan.id)
    .input("end_date",    sql.DateTime2,     endDate)
    .input("payment_id",  sql.NVarChar(255), utrNumber || null)
    .input("amount_paid", sql.Decimal(10,2), plan.price)
    .query(`
      INSERT INTO user_subscriptions (account_id, plan_id, end_date, status, payment_id, amount_paid)
      OUTPUT INSERTED.*
      VALUES (@account_id, @plan_id, @end_date, 'ACTIVE', @payment_id, @amount_paid)
    `);

  const sub = result.recordset[0];
  const months = Math.round(plan.duration_days / 30);

  return {
    subscription: {
      ...sub,
      expires_on:  endDate.toISOString().split("T")[0],
      days_left:   plan.duration_days,
    },
    plan: {
      id:                  plan.id,
      name:                plan.name,
      price:               plan.price,
      duration_days:       plan.duration_days,
      discount_percentage: plan.discount_percentage,
      features:            plan.features,
    },
    benefit: `You get ${plan.discount_percentage}% off on every class booking while your subscription is active.`,
    message: `You are now subscribed to ${plan.name}! Your plan is active for ${months} month${months > 1 ? "s" : ""} until ${endDate.toDateString()}.`,
  };
};

/* ── GET MY ACTIVE SUBSCRIPTION ─────────────────────────────────────────── */
export const getMySubscriptionService = async (accountId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT
        us.id, us.status, us.start_date, us.end_date, us.amount_paid, us.created_at,
        sp.name AS plan_name, sp.description AS plan_description,
        sp.price, sp.duration_days, sp.discount_percentage, sp.features,
        DATEDIFF(DAY, SYSDATETIME(), us.end_date) AS days_remaining
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.account_id = @account_id
        AND us.status = 'ACTIVE'
        AND us.end_date > SYSDATETIME()
      ORDER BY us.created_at DESC
    `);

  if (result.recordset.length === 0) {
    return {
      has_subscription: false,
      discount_percentage: 0,
      message: "You don't have an active subscription. Subscribe to a plan to get discounts on all class bookings.",
      subscription: null,
    };
  }

  const sub = result.recordset[0];
  return {
    has_subscription:    true,
    discount_percentage: sub.discount_percentage,
    subscription: {
      ...sub,
      days_remaining: sub.days_remaining,
      expires_on:     new Date(sub.end_date).toDateString(),
    },
  };
};

/* ── CANCEL SUBSCRIPTION ────────────────────────────────────────────────── */
export const cancelSubscriptionService = async (accountId, subscriptionId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id",         sql.BigInt, parseInt(subscriptionId))
    .input("account_id", sql.BigInt, accountId)
    .query(`
      UPDATE user_subscriptions SET status = 'CANCELLED'
      OUTPUT INSERTED.*
      WHERE id = @id AND account_id = @account_id AND status = 'ACTIVE'
    `);

  if (result.recordset.length === 0) throw new Error("No active subscription found to cancel");
  return result.recordset[0];
};

/* ── GET USER'S ACTIVE DISCOUNT (used by payment service) ───────────────── */
export const getUserSubscriptionDiscountService = async (accountId) => {
  const pool = getPool();
  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT sp.discount_percentage
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.account_id = @account_id
        AND us.status = 'ACTIVE'
        AND us.end_date > SYSDATETIME()
    `);

  if (result.recordset.length === 0) return 0;
  return parseFloat(result.recordset[0].discount_percentage || 0);
};
