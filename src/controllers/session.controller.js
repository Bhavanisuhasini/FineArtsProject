import { getPool, sql } from "../config/db.js";

// ✅ CREATE SESSION (trainer posts zoom link + schedule)
export const createSession = async (req, res) => {
  try {
    const account_id = req.user?.id;
    const pool = getPool();

    const trainerRes = await pool.request()
      .input("account_id", sql.BigInt, account_id)
      .query(`SELECT id FROM trainers WHERE account_id = @account_id`);

    const trainer_id = trainerRes.recordset[0]?.id;
    if (!trainer_id)
      return res.status(403).json({ success: false, message: "Trainer profile not found" });

    const { class_id, session_date, start_time, end_time, zoom_link, zoom_meeting_id } = req.body;

    if (!class_id || !session_date || !start_time || !zoom_link)
      return res.status(400).json({ success: false, message: "class_id, session_date, start_time and zoom_link are required" });

    const result = await pool.request()
      .input("class_id",        sql.BigInt,   class_id)
      .input("trainer_id",      sql.BigInt,   trainer_id)
      .input("session_date",    sql.Date,     new Date(session_date))
      .input("start_time",      sql.NVarChar, start_time)
      .input("end_time",        sql.NVarChar, end_time        || null)
      .input("zoom_link",       sql.NVarChar, zoom_link)
      .input("zoom_meeting_id", sql.NVarChar, zoom_meeting_id || null)
      .query(`
        INSERT INTO class_sessions
          (class_id, trainer_id, session_date, start_time, end_time, zoom_link, zoom_meeting_id)
        OUTPUT INSERTED.*
        VALUES
          (@class_id, @trainer_id, @session_date, @start_time, @end_time, @zoom_link, @zoom_meeting_id)
      `);

    const session = result.recordset[0];

    // Notify all confirmed students for this class
    await pool.request()
      .input("class_id", sql.BigInt,   class_id)
      .input("title",    sql.NVarChar, "Session Scheduled! 🎉")
      .input("message",  sql.NVarChar, `Your trainer has scheduled a session on ${session_date} at ${start_time}. Zoom link is ready!`)
      .input("body",     sql.NVarChar, JSON.stringify({ session_id: session.id, zoom_link, session_date, start_time }))
      .input("type",     sql.NVarChar, "SESSION")
      .query(`
        INSERT INTO notifications (user_id, title, message, body, type, is_read, created_at)
        SELECT b.user_id, @title, @message, @body, @type, 0, SYSDATETIME()
        FROM bookings b
        WHERE b.class_id = @class_id AND b.status = 'CONFIRMED'
      `);

    res.status(201).json({ success: true, message: "Session created", data: session });
  } catch (err) {
    console.error("createSession:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ UPDATE SESSION
export const updateSession = async (req, res) => {
  try {
    const { session_date, start_time, end_time, zoom_link, zoom_meeting_id } = req.body;
    const pool = getPool();

    await pool.request()
      .input("id",              sql.BigInt,   req.params.id)
      .input("session_date",    sql.Date,     session_date    ? new Date(session_date) : null)
      .input("start_time",      sql.NVarChar, start_time      || null)
      .input("end_time",        sql.NVarChar, end_time        || null)
      .input("zoom_link",       sql.NVarChar, zoom_link       || null)
      .input("zoom_meeting_id", sql.NVarChar, zoom_meeting_id || null)
      .query(`
        UPDATE class_sessions SET
          session_date    = COALESCE(@session_date,    session_date),
          start_time      = COALESCE(@start_time,      start_time),
          end_time        = COALESCE(@end_time,        end_time),
          zoom_link       = COALESCE(@zoom_link,       zoom_link),
          zoom_meeting_id = COALESCE(@zoom_meeting_id, zoom_meeting_id)
        WHERE id = @id
      `);

    res.json({ success: true, message: "Session updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ CANCEL SESSION
export const cancelSession = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input("id", sql.BigInt, req.params.id)
      .query(`DELETE FROM class_sessions WHERE id = @id`);
    res.json({ success: true, message: "Session cancelled" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ TRAINER: pending bookings (need session creation)
export const getTrainerPendingBookings = async (req, res) => {
  try {
    const account_id = req.user?.id;
    const pool = getPool();

    const trainerRes = await pool.request()
      .input("account_id", sql.BigInt, account_id)
      .query(`SELECT id FROM trainers WHERE account_id = @account_id`);

    const trainer_id = trainerRes.recordset[0]?.id;
    if (!trainer_id) return res.json({ success: true, data: [] });

    const result = await pool.request()
      .input("trainer_id", sql.BigInt, trainer_id)
      .query(`
        SELECT
          b.id          AS booking_id,
          b.created_at  AS booked_at,
          b.amount,
          b.status,
          c.id          AS class_id,
          c.title       AS class_title,
          c.level,
          c.mode,
          ac.username   AS student_name,
          ac.email      AS student_email
        FROM bookings b
        JOIN classes  c  ON c.id  = b.class_id
        JOIN accounts ac ON ac.id = b.user_id
        WHERE b.trainer_id = @trainer_id
          AND b.status     = 'CONFIRMED'
        ORDER BY b.created_at DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ TRAINER: today's sessions
export const getTrainerToday = async (req, res) => {
  try {
    const account_id = req.user?.id;
    const pool = getPool();

    const trainerRes = await pool.request()
      .input("account_id", sql.BigInt, account_id)
      .query(`SELECT id FROM trainers WHERE account_id = @account_id`);

    const trainer_id = trainerRes.recordset[0]?.id;
    if (!trainer_id) return res.json({ success: true, data: [] });

    const result = await pool.request()
      .input("trainer_id", sql.BigInt, trainer_id)
      .query(`
        SELECT
          cs.*,
          c.title AS class_title,
          c.image AS class_image,
          (SELECT COUNT(*) FROM bookings b WHERE b.class_id = cs.class_id AND b.status = 'CONFIRMED') AS student_count
        FROM class_sessions cs
        LEFT JOIN classes c ON c.id = cs.class_id
        WHERE cs.trainer_id  = @trainer_id
          AND cs.session_date = CAST(GETDATE() AS DATE)
        ORDER BY cs.start_time
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ TRAINER: upcoming sessions
export const getTrainerUpcoming = async (req, res) => {
  try {
    const account_id = req.user?.id;
    const days = parseInt(req.query.days) || 30;
    const pool = getPool();

    const trainerRes = await pool.request()
      .input("account_id", sql.BigInt, account_id)
      .query(`SELECT id FROM trainers WHERE account_id = @account_id`);

    const trainer_id = trainerRes.recordset[0]?.id;
    if (!trainer_id) return res.json({ success: true, data: [] });

    const result = await pool.request()
      .input("trainer_id", sql.BigInt, trainer_id)
      .input("days",       sql.Int,    days)
      .query(`
        SELECT
          cs.*,
          c.title AS class_title,
          c.image AS class_image,
          (SELECT COUNT(*) FROM bookings b WHERE b.class_id = cs.class_id AND b.status = 'CONFIRMED') AS student_count
        FROM class_sessions cs
        LEFT JOIN classes c ON c.id = cs.class_id
        WHERE cs.trainer_id  = @trainer_id
          AND cs.session_date >= CAST(GETDATE() AS DATE)
          AND cs.session_date <= DATEADD(DAY, @days, CAST(GETDATE() AS DATE))
        ORDER BY cs.session_date, cs.start_time
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ USER: today's sessions with join button
export const getUserToday = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const pool = getPool();

    const result = await pool.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`
        SELECT
          cs.id          AS session_id,
          cs.session_date,
          cs.start_time,
          cs.end_time,
          cs.zoom_link,
          cs.zoom_meeting_id,
          c.title        AS class_title,
          c.image        AS class_image,
          t.full_name    AS trainer_name
        FROM bookings b
        JOIN class_sessions cs ON cs.class_id   = b.class_id
        JOIN classes        c  ON c.id          = b.class_id
        JOIN trainers       t  ON t.id          = cs.trainer_id
        WHERE b.user_id       = @user_id
          AND b.status        = 'CONFIRMED'
          AND cs.session_date = CAST(GETDATE() AS DATE)
        ORDER BY cs.start_time
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ USER: upcoming sessions
export const getUserUpcoming = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const days = parseInt(req.query.days) || 30;
    const pool = getPool();

    const result = await pool.request()
      .input("user_id", sql.BigInt, user_id)
      .input("days",    sql.Int,    days)
      .query(`
        SELECT
          cs.id          AS session_id,
          cs.session_date,
          cs.start_time,
          cs.end_time,
          cs.zoom_link,
          b.id           AS booking_id,
          b.status       AS booking_status,
          b.amount,
          c.title        AS class_title,
          c.image        AS class_image,
          c.level,
          c.mode,
          t.full_name    AS trainer_name,
          t.profile_image AS trainer_image
        FROM bookings b
        JOIN classes        c  ON c.id = b.class_id
        JOIN trainers       t  ON t.id = b.trainer_id
        LEFT JOIN class_sessions cs ON cs.class_id = b.class_id
                                   AND cs.session_date >= CAST(GETDATE() AS DATE)
                                   AND cs.session_date <= DATEADD(DAY, @days, CAST(GETDATE() AS DATE))
        WHERE b.user_id = @user_id
          AND b.status  = 'CONFIRMED'
        ORDER BY cs.session_date, cs.start_time
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ PUBLIC: sessions for a class (no zoom link)
export const getClassSessions = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input("class_id", sql.BigInt, req.params.classId)
      .query(`
        SELECT id, session_date, start_time, end_time
        FROM class_sessions
        WHERE class_id    = @class_id
          AND session_date >= CAST(GETDATE() AS DATE)
        ORDER BY session_date, start_time
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};