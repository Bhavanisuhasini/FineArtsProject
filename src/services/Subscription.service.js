// ═══════════════════════════════════════════════════════════
// subscription.service.js
// ═══════════════════════════════════════════════════════════
import { getPool, sql } from "../config/db.js";

/*
  SQL to create subscriptions tables (run once in SSMS):

  CREATE TABLE subscription_plans (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500) NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL,
    plan_type NVARCHAR(20) NOT NULL DEFAULT 'USER',
    features NVARCHAR(1000) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_plan_type CHECK (plan_type IN ('USER','TRAINER','INSTITUTE'))
  );

  CREATE TABLE user_subscriptions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    start_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    end_date DATETIME2 NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    payment_id NVARCHAR(255) NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_usub_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT fk_usub_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    CONSTRAINT chk_sub_status CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED'))
  );
*/

export const listPlansService = async (plan_type) => {
  const pool = getPool();
  const request = pool.request().input("is_active", sql.Bit, 1);
  let where = `WHERE is_active = @is_active`;
  if (plan_type) {
    where += ` AND plan_type = @plan_type`;
    request.input("plan_type", sql.NVarChar(20), plan_type);
  }
  const result = await request.query(`SELECT * FROM subscription_plans ${where} ORDER BY price ASC`);
  return result.recordset;
};

export const getPlanByIdService = async (planId) => {
  const pool = getPool();
  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(planId))
    .query(`SELECT * FROM subscription_plans WHERE id = @id`);
  if (result.recordset.length === 0) throw new Error("Plan not found");
  return result.recordset[0];
};

export const createPlanService = async (body) => {
  const pool = getPool();
  const { name, description, price, duration_days, plan_type, features } = body;
  if (!name || !price || !duration_days || !plan_type) throw new Error("name, price, duration_days, plan_type required");
  const result = await pool.request()
    .input("name", sql.NVarChar(100), name)
    .input("description", sql.NVarChar(500), description || null)
    .input("price", sql.Decimal(10, 2), parseFloat(price))
    .input("duration_days", sql.Int, parseInt(duration_days))
    .input("plan_type", sql.NVarChar(20), plan_type)
    .input("features", sql.NVarChar(1000), features || null)
    .query(`
      INSERT INTO subscription_plans (name, description, price, duration_days, plan_type, features)
      OUTPUT INSERTED.*
      VALUES (@name, @description, @price, @duration_days, @plan_type, @features)
    `);
  return result.recordset[0];
};

export const updatePlanService = async (planId, body) => {
  const pool = getPool();
  const { name, description, price, duration_days, features, is_active } = body;
  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(planId))
    .input("name", sql.NVarChar(100), name)
    .input("description", sql.NVarChar(500), description || null)
    .input("price", sql.Decimal(10, 2), parseFloat(price))
    .input("duration_days", sql.Int, parseInt(duration_days))
    .input("features", sql.NVarChar(1000), features || null)
    .input("is_active", sql.Bit, is_active !== undefined ? is_active : 1)
    .query(`
      UPDATE subscription_plans SET
        name = @name, description = @description, price = @price,
        duration_days = @duration_days, features = @features, is_active = @is_active
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  if (result.recordset.length === 0) throw new Error("Plan not found");
  return result.recordset[0];
};

export const subscribeToPlanService = async (accountId, planId, paymentId) => {
  const pool = getPool();

  const planResult = await pool.request()
    .input("id", sql.BigInt, parseInt(planId))
    .query(`SELECT * FROM subscription_plans WHERE id = @id AND is_active = 1`);

  if (planResult.recordset.length === 0) throw new Error("Plan not found or inactive");
  const plan = planResult.recordset[0];

  // Cancel existing active subscription for same plan_type
  await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .input("plan_type", sql.NVarChar(20), plan.plan_type)
    .query(`
      UPDATE user_subscriptions SET status = 'CANCELLED'
      WHERE account_id = @account_id AND status = 'ACTIVE'
        AND plan_id IN (SELECT id FROM subscription_plans WHERE plan_type = @plan_type)
    `);

  // Calculate end date
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.duration_days);

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .input("plan_id", sql.BigInt, plan.id)
    .input("end_date", sql.DateTime2, endDate)
    .input("payment_id", sql.NVarChar(255), paymentId || null)
    .input("amount_paid", sql.Decimal(10, 2), plan.price)
    .query(`
      INSERT INTO user_subscriptions (account_id, plan_id, end_date, status, payment_id, amount_paid)
      OUTPUT INSERTED.*
      VALUES (@account_id, @plan_id, @end_date, 'ACTIVE', @payment_id, @amount_paid)
    `);

  return { subscription: result.recordset[0], plan };
};

export const getMySubscriptionService = async (accountId) => {
  const pool = getPool();
  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT us.*, sp.name AS plan_name, sp.plan_type, sp.features, sp.duration_days
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.account_id = @account_id AND us.status = 'ACTIVE'
        AND us.end_date > SYSDATETIME()
      ORDER BY us.created_at DESC
    `);
  return result.recordset;
};

export const cancelSubscriptionService = async (accountId, subscriptionId) => {
  const pool = getPool();
  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(subscriptionId))
    .input("account_id", sql.BigInt, accountId)
    .query(`
      UPDATE user_subscriptions SET status = 'CANCELLED'
      OUTPUT INSERTED.*
      WHERE id = @id AND account_id = @account_id AND status = 'ACTIVE'
    `);
  if (result.recordset.length === 0) throw new Error("Subscription not found or already cancelled");
  return result.recordset[0];
};