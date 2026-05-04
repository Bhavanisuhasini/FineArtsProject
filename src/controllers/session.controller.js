import {
  createSessionService,
  updateSessionService,
  getTrainerTodaySessionsService,
  getTrainerUpcomingSessionsService,
  getUserTodaySessionsService,
  getUserUpcomingSessionsService,
  getClassSessionsService,
  cancelSessionService,
} from "../services/session.service.js";

const ok   = (res, data, msg = "Success", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, status = 400) => res.status(status).json({ success: false, message: e.message });

/* ── TRAINER: Post a session with Zoom link ─────────────────────────────── */
export const createSession = async (req, res) => {
  try {
    const data = await createSessionService(req.account.id, req.body);
    ok(res, data, "Session posted successfully", 201);
  } catch (e) { fail(res, e); }
};

/* ── TRAINER: Update session (e.g. update Zoom link) ───────────────────── */
export const updateSession = async (req, res) => {
  try {
    const data = await updateSessionService(req.account.id, req.params.id, req.body);
    ok(res, data, "Session updated");
  } catch (e) { fail(res, e); }
};

/* ── TRAINER: Cancel a session ──────────────────────────────────────────── */
export const cancelSession = async (req, res) => {
  try {
    const data = await cancelSessionService(req.account.id, req.params.id);
    ok(res, data, "Session cancelled. Your enrolled students will be notified.");
  } catch (e) { fail(res, e); }
};

/* ── TRAINER: My sessions today ─────────────────────────────────────────── */
export const getTrainerToday = async (req, res) => {
  try {
    const data = await getTrainerTodaySessionsService(req.account.id);
    ok(res, data, data.message);
  } catch (e) { fail(res, e); }
};

/* ── TRAINER: My upcoming sessions ─────────────────────────────────────── */
export const getTrainerUpcoming = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await getTrainerUpcomingSessionsService(req.account.id, days);
    ok(res, data, `Upcoming sessions for the next ${days} days`);
  } catch (e) { fail(res, e); }
};

/* ── USER: My classes today with Join button ────────────────────────────── */
export const getUserToday = async (req, res) => {
  try {
    const data = await getUserTodaySessionsService(req.account.id);
    ok(res, data, data.message);
  } catch (e) { fail(res, e); }
};

/* ── USER: My upcoming sessions ─────────────────────────────────────────── */
export const getUserUpcoming = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await getUserUpcomingSessionsService(req.account.id, days);
    ok(res, data, `Your upcoming sessions for the next ${days} days`);
  } catch (e) { fail(res, e); }
};

/* ── PUBLIC: Sessions for a class ───────────────────────────────────────── */
export const getClassSessions = async (req, res) => {
  try {
    const data = await getClassSessionsService(req.params.classId);
    ok(res, data);
  } catch (e) { fail(res, e); }
};
