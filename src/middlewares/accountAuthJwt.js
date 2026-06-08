import { getPool, sql } from "../config/db.js";

export const accountAuthJwt = async (
  req,
  res,
  next
) => {
  try {
    const accountId =
      req.user?.account_id;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: "Account missing",
      });
    }

    const pool = getPool();

    const result = await pool.request()
      .input(
        "id",
        sql.BigInt,
        accountId
      )
      .query(`
        SELECT *
        FROM accounts
        WHERE id = @id
      `);

    if (
      result.recordset.length === 0
    ) {
      return res.status(401).json({
        success: false,
        message: "Account not found",
      });
    }

    req.account =
      result.recordset[0];

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Account authentication failed",
    });
  }
};