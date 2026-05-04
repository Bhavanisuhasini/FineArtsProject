import { getPool, sql } from "../config/db.js";

/*
  SQL — run once in SSMS:

  CREATE TABLE coupons (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL,
    discount_type NVARCHAR(20) NOT NULL DEFAULT 'PERCENT',  -- PERCENT | FLAT
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) NULL,
    max_discount_amount DECIMAL(10,2) NULL,
    usage_limit INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    valid_from DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    valid_until DATETIME2 NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_by BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT chk_discount_type CHECK (discount_type IN ('PERCENT','FLAT'))
  );

  CREATE TABLE coupon_usages (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    coupon_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    booking_id BIGINT NULL,
    discount_applied DECIMAL(10,2) NOT NULL,
    used_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_cu_coupon  FOREIGN KEY (coupon_id)  REFERENCES coupons(id),
    CONSTRAINT fk_cu_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT uq_coupon_user UNIQUE (coupon_id, account_id)
  );

  CREATE TABLE user_rewards (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id BIGINT NOT NULL,
    points INT NOT NULL DEFAULT 0,
    total_earned INT NOT NULL DEFAULT 0,
    total_redeemed INT NOT NULL DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_ur_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT uq_ur_account UNIQUE (account_id)
  );

  CREATE TABLE reward_transactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    account_id BIGINT NOT NULL,
    points INT NOT NULL,
    type NVARCHAR(20) NOT NULL,  -- EARNED | REDEEMED | EXPIRED | GIFT
    description NVARCHAR(500) NULL,
    reference_id BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_rt_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT chk_reward_type CHECK (type IN ('EARNED','REDEEMED','EXPIRED','GIFT'))
  );
*/

/* ── VALIDATE & APPLY COUPON ────────────────────────────────────────────── */
export const validateCouponService = async (accountId, code, orderAmount) => {
  const pool = getPool();

  const result = await pool.request()
    .input("code", sql.NVarChar(50), code.trim().toUpperCase())
    .query(`
      SELECT * FROM coupons
      WHERE code = @code AND is_active = 1
        AND (valid_from IS NULL OR valid_from <= SYSDATETIME())
        AND (valid_until IS NULL OR valid_until >= SYSDATETIME())
    `);

  if (result.recordset.length === 0) throw new Error("Invalid or expired coupon code");
  const coupon = result.recordset[0];

  // Check usage limit
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    throw new Error("This coupon has reached its usage limit");
  }

  // Check if user already used this coupon
  const usageCheck = await pool.request()
    .input("coupon_id",  sql.BigInt, coupon.id)
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id FROM coupon_usages WHERE coupon_id = @coupon_id AND account_id = @account_id`);

  if (usageCheck.recordset.length > 0) throw new Error("You have already used this coupon");

  // Check minimum order amount
  if (coupon.min_order_amount && parseFloat(orderAmount) < coupon.min_order_amount) {
    throw new Error(`Minimum order amount of ₹${coupon.min_order_amount} required for this coupon`);
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === "PERCENT") {
    discountAmount = (parseFloat(orderAmount) * coupon.discount_value) / 100;
    if (coupon.max_discount_amount) {
      discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
    }
  } else {
    discountAmount = coupon.discount_value;
  }

  discountAmount = Math.min(discountAmount, parseFloat(orderAmount));
  const finalAmount = parseFloat(orderAmount) - discountAmount;

  return {
    coupon_id:       coupon.id,
    code:            coupon.code,
    description:     coupon.description,
    discount_type:   coupon.discount_type,
    discount_value:  coupon.discount_value,
    discount_amount: parseFloat(discountAmount.toFixed(2)),
    original_amount: parseFloat(orderAmount),
    final_amount:    parseFloat(finalAmount.toFixed(2)),
  };
};

export const recordCouponUsage = async (pool, couponId, accountId, bookingId, discountApplied) => {
  await pool.request()
    .input("coupon_id",        sql.BigInt,       couponId)
    .input("account_id",       sql.BigInt,       accountId)
    .input("booking_id",       sql.BigInt,       bookingId || null)
    .input("discount_applied", sql.Decimal(10,2),discountApplied)
    .query(`
      INSERT INTO coupon_usages (coupon_id, account_id, booking_id, discount_applied)
      VALUES (@coupon_id, @account_id, @booking_id, @discount_applied);

      UPDATE coupons SET used_count = used_count + 1 WHERE id = @coupon_id;
    `);
};

/* ── ADMIN: CREATE COUPON ───────────────────────────────────────────────── */
export const createCouponService = async (adminId, body) => {
  const pool = getPool();
  const {
    code, description, discount_type, discount_value,
    min_order_amount, max_discount_amount, usage_limit, valid_until,
  } = body;

  if (!code || !discount_type || !discount_value) {
    throw new Error("code, discount_type, and discount_value are required");
  }

  const result = await pool.request()
    .input("code",                sql.NVarChar(50),   code.trim().toUpperCase())
    .input("description",         sql.NVarChar(500),  description || null)
    .input("discount_type",       sql.NVarChar(20),   discount_type)
    .input("discount_value",      sql.Decimal(10,2),  parseFloat(discount_value))
    .input("min_order_amount",    sql.Decimal(10,2),  min_order_amount ? parseFloat(min_order_amount) : null)
    .input("max_discount_amount", sql.Decimal(10,2),  max_discount_amount ? parseFloat(max_discount_amount) : null)
    .input("usage_limit",         sql.Int,            usage_limit ? parseInt(usage_limit) : null)
    .input("valid_until",         sql.DateTime2,      valid_until ? new Date(valid_until) : null)
    .input("created_by",          sql.BigInt,         adminId)
    .query(`
      INSERT INTO coupons
        (code, description, discount_type, discount_value, min_order_amount,
         max_discount_amount, usage_limit, valid_until, created_by)
      OUTPUT INSERTED.*
      VALUES
        (@code, @description, @discount_type, @discount_value, @min_order_amount,
         @max_discount_amount, @usage_limit, @valid_until, @created_by)
    `);

  return result.recordset[0];
};

export const listCouponsService = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT * FROM coupons ORDER BY created_at DESC
  `);
  return result.recordset;
};

export const toggleCouponService = async (couponId, isActive) => {
  const pool = getPool();
  const result = await pool.request()
    .input("id",        sql.BigInt, parseInt(couponId))
    .input("is_active", sql.Bit,    isActive ? 1 : 0)
    .query(`UPDATE coupons SET is_active = @is_active OUTPUT INSERTED.* WHERE id = @id`);
  if (result.recordset.length === 0) throw new Error("Coupon not found");
  return result.recordset[0];
};

/* ── REWARDS / POINTS ───────────────────────────────────────────────────── */
const POINTS_PER_BOOKING = 10;
const POINTS_PER_REFERRAL = 50;

export const getMyRewardsService = async (accountId) => {
  const pool = getPool();

  // Upsert rewards row
  await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM user_rewards WHERE account_id = @account_id)
        INSERT INTO user_rewards (account_id, points, total_earned, total_redeemed)
        VALUES (@account_id, 0, 0, 0)
    `);

  const rewards = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT * FROM user_rewards WHERE account_id = @account_id`);

  const history = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT * FROM reward_transactions
      WHERE account_id = @account_id
      ORDER BY created_at DESC
    `);

  return {
    ...rewards.recordset[0],
    history: history.recordset,
  };
};

export const earnPointsService = async (pool, accountId, points, type, description, referenceId) => {
  // Upsert rewards row
  await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM user_rewards WHERE account_id = @account_id)
        INSERT INTO user_rewards (account_id, points, total_earned, total_redeemed)
        VALUES (@account_id, 0, 0, 0)
    `);

  await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .input("points",     sql.Int,    points)
    .query(`
      UPDATE user_rewards SET
        points        = points + @points,
        total_earned  = total_earned + @points,
        updated_at    = SYSDATETIME()
      WHERE account_id = @account_id
    `);

  await pool.request()
    .input("account_id",   sql.BigInt,       accountId)
    .input("points",       sql.Int,          points)
    .input("type",         sql.NVarChar(20), type)
    .input("description",  sql.NVarChar(500),description || null)
    .input("reference_id", sql.BigInt,       referenceId || null)
    .query(`
      INSERT INTO reward_transactions (account_id, points, type, description, reference_id)
      VALUES (@account_id, @points, @type, @description, @reference_id)
    `);
};

export const redeemPointsService = async (accountId, points) => {
  const pool = getPool();

  const rewards = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT * FROM user_rewards WHERE account_id = @account_id`);

  if (rewards.recordset.length === 0 || rewards.recordset[0].points < points) {
    throw new Error("Insufficient reward points");
  }

  // 1 point = ₹0.10 discount
  const discountAmount = parseFloat((points * 0.10).toFixed(2));

  await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .input("points",     sql.Int,    points)
    .query(`
      UPDATE user_rewards SET
        points           = points - @points,
        total_redeemed   = total_redeemed + @points,
        updated_at       = SYSDATETIME()
      WHERE account_id = @account_id
    `);

  await pool.request()
    .input("account_id",  sql.BigInt,       accountId)
    .input("points",      sql.Int,          -points)
    .input("description", sql.NVarChar(500),`Redeemed ${points} points for ₹${discountAmount} discount`)
    .query(`
      INSERT INTO reward_transactions (account_id, points, type, description)
      VALUES (@account_id, @points, 'REDEEMED', @description)
    `);

  return { points_redeemed: points, discount_amount: discountAmount };
};

export { POINTS_PER_BOOKING, POINTS_PER_REFERRAL };
