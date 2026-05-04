import { getPool, sql } from "../config/db.js";

/*
  SQL — run once in SSMS:

  CREATE TABLE class_sessions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    class_id BIGINT NOT NULL,
    trainer_id BIGINT NOT NULL,
    session_date DATE NOT NULL,
    start_time NVARCHAR(10) NOT NULL,
    end_time NVARCHAR(10) NOT NULL,
    zoom_link NVARCHAR(500) NULL,
    zoom_meeting_id NVARCHAR(100) NULL,
    zoom_password NVARCHAR(50) NULL,
    title NVARCHAR(200) NULL,
    notes NVARCHAR(1000) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_cs_class   FOREIGN KEY (class_id)   REFERENCES classes(id),
    CONSTRAINT fk_cs_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id),
    CONSTRAINT chk_session_status CHECK (status IN ('SCHEDULED','LIVE','COMPLETED','CANCELLED'))
  );
*/

/* ── TRAINER: POST A SESSION FOR TODAY / UPCOMING ───────────────────────── */
export const createSessionService = async (accountId, body) => {
  const pool = getPool();

  const {
    class_id, session_date, start_time, end_time,
    zoom_link, zoom_meeting_id, zoom_password, title, notes,
  } = body;

  if (!class_id)     throw new Error("class_id is required");
  if (!session_date) throw new Error("session_date is required (YYYY-MM-DD)");
  if (!start_time)   throw new Error("start_time is required (HH:MM)");
  if (!end_time)     throw new Error("end_time is required (HH:MM)");

  // Verify trainer owns this class
  const trainerResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id FROM trainers WHERE account_id = @account_id`);

  if (trainerResult.recordset.length === 0) throw new Error("Trainer profile not found");
  const trainerId = trainerResult.recordset[0].id;

  const classCheck = await pool.request()
    .input("class_id",   sql.BigInt, parseInt(class_id))
    .input("trainer_id", sql.BigInt, trainerId)
    .query(`
      SELECT id, title, mode FROM classes
      WHERE id = @class_id AND trainer_id = @trainer_id AND is_active = 1
    `);

  if (classCheck.recordset.length === 0) {
    throw new Error("Class not found or you are not the trainer for this class");
  }

  const cls = classCheck.recordset[0];

  // Warn if offline class gets a zoom link (non-blocking)
  const isOnline = cls.mode === "ONLINE" || cls.mode === "HYBRID";

  // Check for duplicate session on same date
  const dupCheck = await pool.request()
    .input("class_id",     sql.BigInt, parseInt(class_id))
    .input("session_date", sql.Date,   new Date(session_date))
    .query(`SELECT id FROM class_sessions WHERE class_id = @class_id AND session_date = @session_date AND status != 'CANCELLED'`);

  if (dupCheck.recordset.length > 0) {
    throw new Error(`A session for this class on ${session_date} already exists. Cancel it first if you want to reschedule.`);
  }

  const result = await pool.request()
    .input("class_id",       sql.BigInt,       parseInt(class_id))
    .input("trainer_id",     sql.BigInt,       trainerId)
    .input("session_date",   sql.Date,         new Date(session_date))
    .input("start_time",     sql.NVarChar(10), start_time)
    .input("end_time",       sql.NVarChar(10), end_time)
    .input("zoom_link",      sql.NVarChar(500),zoom_link || null)
    .input("zoom_meeting_id",sql.NVarChar(100),zoom_meeting_id || null)
    .input("zoom_password",  sql.NVarChar(50), zoom_password || null)
    .input("title",          sql.NVarChar(200),title || cls.title)
    .input("notes",          sql.NVarChar(1000),notes || null)
    .query(`
      INSERT INTO class_sessions
        (class_id, trainer_id, session_date, start_time, end_time,
         zoom_link, zoom_meeting_id, zoom_password, title, notes, status)
      OUTPUT INSERTED.*
      VALUES
        (@class_id, @trainer_id, @session_date, @start_time, @end_time,
         @zoom_link, @zoom_meeting_id, @zoom_password, @title, @notes, 'SCHEDULED')
    `);

  const session = result.recordset[0];

  return {
    ...session,
    class_title: cls.title,
    mode:        cls.mode,
    note: !isOnline && zoom_link
      ? "Note: This is an offline class. The Zoom link will be visible to enrolled students."
      : null,
  };
};

/* ── TRAINER: UPDATE SESSION (e.g. change zoom link) ────────────────────── */
export const updateSessionService = async (accountId, sessionId, body) => {
  const pool = getPool();

  const trainerResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id FROM trainers WHERE account_id = @account_id`);

  if (trainerResult.recordset.length === 0) throw new Error("Trainer profile not found");
  const trainerId = trainerResult.recordset[0].id;

  const sessionCheck = await pool.request()
    .input("id",         sql.BigInt, parseInt(sessionId))
    .input("trainer_id", sql.BigInt, trainerId)
    .query(`SELECT * FROM class_sessions WHERE id = @id AND trainer_id = @trainer_id`);

  if (sessionCheck.recordset.length === 0) throw new Error("Session not found or access denied");
  const old = sessionCheck.recordset[0];

  const { zoom_link, zoom_meeting_id, zoom_password, title, notes, start_time, end_time, status } = body;

  const result = await pool.request()
    .input("id",             sql.BigInt,        parseInt(sessionId))
    .input("zoom_link",      sql.NVarChar(500),  zoom_link      ?? old.zoom_link)
    .input("zoom_meeting_id",sql.NVarChar(100),  zoom_meeting_id ?? old.zoom_meeting_id)
    .input("zoom_password",  sql.NVarChar(50),   zoom_password  ?? old.zoom_password)
    .input("title",          sql.NVarChar(200),  title          ?? old.title)
    .input("notes",          sql.NVarChar(1000), notes          ?? old.notes)
    .input("start_time",     sql.NVarChar(10),   start_time     ?? old.start_time)
    .input("end_time",       sql.NVarChar(10),   end_time       ?? old.end_time)
    .input("status",         sql.NVarChar(20),   status         ?? old.status)
    .query(`
      UPDATE class_sessions SET
        zoom_link = @zoom_link, zoom_meeting_id = @zoom_meeting_id,
        zoom_password = @zoom_password, title = @title, notes = @notes,
        start_time = @start_time, end_time = @end_time, status = @status,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  return result.recordset[0];
};

/* ── TRAINER: GET MY SESSIONS TODAY ─────────────────────────────────────── */
export const getTrainerTodaySessionsService = async (accountId) => {
  const pool = getPool();

  const trainerResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id FROM trainers WHERE account_id = @account_id`);

  if (trainerResult.recordset.length === 0) throw new Error("Trainer profile not found");
  const trainerId = trainerResult.recordset[0].id;

  const result = await pool.request()
    .input("trainer_id", sql.BigInt, trainerId)
    .query(`
      SELECT
        cs.id AS session_id, cs.session_date, cs.start_time, cs.end_time,
        cs.zoom_link, cs.zoom_meeting_id, cs.zoom_password,
        cs.title AS session_title, cs.notes, cs.status,
        c.id AS class_id, c.title AS class_title, c.mode, c.level,
        c.max_students,
        (SELECT COUNT(*) FROM bookings WHERE class_id = c.id AND status = 'CONFIRMED') AS enrolled_count,
        cat.name AS category_name
      FROM class_sessions cs
      JOIN classes c ON cs.class_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE cs.trainer_id = @trainer_id
        AND cs.session_date = CAST(SYSDATETIME() AS DATE)
        AND cs.status IN ('SCHEDULED', 'LIVE')
      ORDER BY cs.start_time ASC
    `);

  return {
    date:     new Date().toDateString(),
    count:    result.recordset.length,
    sessions: result.recordset,
    message:  result.recordset.length === 0
      ? "No sessions scheduled for today. Post a session to let your students know."
      : `You have ${result.recordset.length} session(s) today.`,
  };
};

/* ── TRAINER: GET MY UPCOMING SESSIONS ──────────────────────────────────── */
export const getTrainerUpcomingSessionsService = async (accountId, days = 7) => {
  const pool = getPool();

  const trainerResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id FROM trainers WHERE account_id = @account_id`);

  if (trainerResult.recordset.length === 0) throw new Error("Trainer profile not found");
  const trainerId = trainerResult.recordset[0].id;

  const result = await pool.request()
    .input("trainer_id", sql.BigInt, trainerId)
    .input("days",       sql.Int,    parseInt(days))
    .query(`
      SELECT
        cs.id AS session_id, cs.session_date, cs.start_time, cs.end_time,
        cs.zoom_link, cs.title AS session_title, cs.status,
        c.id AS class_id, c.title AS class_title, c.mode,
        (SELECT COUNT(*) FROM bookings WHERE class_id = c.id AND status = 'CONFIRMED') AS enrolled_count
      FROM class_sessions cs
      JOIN classes c ON cs.class_id = c.id
      WHERE cs.trainer_id = @trainer_id
        AND cs.session_date >= CAST(SYSDATETIME() AS DATE)
        AND cs.session_date <= DATEADD(DAY, @days, CAST(SYSDATETIME() AS DATE))
        AND cs.status != 'CANCELLED'
      ORDER BY cs.session_date ASC, cs.start_time ASC
    `);

  return result.recordset;
};

/* ── USER: GET MY CLASSES TODAY (with Join button) ──────────────────────── */
export const getUserTodaySessionsService = async (accountId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.BigInt, accountId)
    .query(`
      SELECT
        cs.id AS session_id,
        cs.session_date,
        cs.start_time,
        cs.end_time,
        cs.zoom_link,
        cs.zoom_meeting_id,
        cs.zoom_password,
        cs.title AS session_title,
        cs.notes,
        cs.status,
        c.id AS class_id,
        c.title AS class_title,
        c.mode,
        c.level,
        c.duration,
        t.full_name AS trainer_name,
        t.profile_image AS trainer_image,
        i.name AS institute_name,
        cat.name AS category_name,
        b.id AS booking_id
      FROM class_sessions cs
      JOIN classes c ON cs.class_id = c.id
      JOIN bookings b ON b.class_id = c.id AND b.user_id = @user_id AND b.status = 'CONFIRMED'
      LEFT JOIN trainers t ON c.trainer_id = t.id
      LEFT JOIN institutes i ON c.institute_id = i.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE cs.session_date = CAST(SYSDATETIME() AS DATE)
        AND cs.status IN ('SCHEDULED', 'LIVE')
      ORDER BY cs.start_time ASC
    `);

  const sessions = result.recordset.map((s) => ({
    ...s,
    can_join:   !!(s.zoom_link),
    join_label: s.zoom_link ? "Join Class" : "Link not posted yet",
  }));

  return {
    date:     new Date().toDateString(),
    count:    sessions.length,
    sessions,
    message:  sessions.length === 0
      ? "No classes scheduled for today."
      : `You have ${sessions.length} class(es) today!`,
  };
};

/* ── USER: GET MY UPCOMING SESSIONS ─────────────────────────────────────── */
export const getUserUpcomingSessionsService = async (accountId, days = 7) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.BigInt, accountId)
    .input("days",    sql.Int,    parseInt(days))
    .query(`
      SELECT
        cs.id AS session_id,
        cs.session_date,
        cs.start_time,
        cs.end_time,
        cs.zoom_link,
        cs.title AS session_title,
        cs.status,
        c.id AS class_id,
        c.title AS class_title,
        c.mode,
        t.full_name AS trainer_name,
        cat.name AS category_name,
        b.id AS booking_id
      FROM class_sessions cs
      JOIN classes c ON cs.class_id = c.id
      JOIN bookings b ON b.class_id = c.id AND b.user_id = @user_id AND b.status = 'CONFIRMED'
      LEFT JOIN trainers t ON c.trainer_id = t.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE cs.session_date >= CAST(SYSDATETIME() AS DATE)
        AND cs.session_date <= DATEADD(DAY, @days, CAST(SYSDATETIME() AS DATE))
        AND cs.status != 'CANCELLED'
      ORDER BY cs.session_date ASC, cs.start_time ASC
    `);

  return result.recordset.map((s) => ({
    ...s,
    can_join:   !!(s.zoom_link),
    join_label: s.zoom_link ? "Join Class" : "Link not posted yet",
  }));
};

/* ── GET SESSIONS FOR A CLASS (public) ──────────────────────────────────── */
export const getClassSessionsService = async (classId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("class_id", sql.BigInt, parseInt(classId))
    .query(`
      SELECT
        id AS session_id, session_date, start_time, end_time,
        title AS session_title, status
      FROM class_sessions
      WHERE class_id = @class_id AND status != 'CANCELLED'
      ORDER BY session_date ASC
    `);

  return result.recordset;
};

/* ── CANCEL SESSION (trainer) ───────────────────────────────────────────── */
export const cancelSessionService = async (accountId, sessionId) => {
  const pool = getPool();

  const trainerResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id FROM trainers WHERE account_id = @account_id`);

  if (trainerResult.recordset.length === 0) throw new Error("Trainer profile not found");
  const trainerId = trainerResult.recordset[0].id;

  const result = await pool.request()
    .input("id",         sql.BigInt, parseInt(sessionId))
    .input("trainer_id", sql.BigInt, trainerId)
    .query(`
      UPDATE class_sessions SET status = 'CANCELLED', updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id AND trainer_id = @trainer_id AND status != 'CANCELLED'
    `);

  if (result.recordset.length === 0) throw new Error("Session not found or already cancelled");
  return result.recordset[0];
};
