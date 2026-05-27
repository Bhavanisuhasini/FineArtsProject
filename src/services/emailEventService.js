// import { sql, getPool } from "../config/db.js";
// import logger from "../utils/logger.js";

// export const saveEmailEvent = async (eventData) => {
//   try {
//     const pool = getPool();

//     await pool
//       .request()
//       .input("eventId", sql.NVarChar, eventData.eventId)
//       .input("userId", sql.BigInt, eventData.userId)
//       .input("toEmail", sql.NVarChar, eventData.toEmail)
//       .input("subject", sql.NVarChar, eventData.subject)
//       .input("templateName", sql.NVarChar, eventData.templateName || null)
//       .input("htmlBody", sql.NVarChar(sql.MAX), eventData.htmlBody || null)
//       .input("status", sql.NVarChar, "PENDING")
//       .query(`
//         INSERT INTO EmailEvents
//         (EventId, UserId, ToEmail, Subject, TemplateName, HtmlBody, Status, CreatedAt)
//         VALUES
//         (@eventId, @userId, @toEmail, @subject, @templateName, @htmlBody, @status, SYSDATETIME())
//       `);

//     logger.info(`Email event saved: ${eventData.eventId}`);
//   } catch (error) {
//     logger.error("Error saving email event:", error);
//     throw error;
//   }
// };

// export const updateEmailStatus = async (eventId, status, messageId = null) => {
//   try {
//     const pool = getPool();

//     await pool
//       .request()
//       .input("eventId", sql.NVarChar, eventId)
//       .input("status", sql.NVarChar, status)
//       .input("messageId", sql.NVarChar, messageId)
//       .query(`
//         UPDATE EmailEvents
//         SET Status = @status, MessageId = @messageId, SentAt = SYSDATETIME()
//         WHERE EventId = @eventId
//       `);

//     logger.info(`Email event status updated: ${eventId} - ${status}`);
//   } catch (error) {
//     logger.error("Error updating email status:", error);
//     throw error;
//   }
// };

// export const getEmailEventById = async (eventId) => {
//   try {
//     const pool = getPool();

//     const result = await pool
//       .request()
//       .input("eventId", sql.NVarChar, eventId)
//       .query(`
//         SELECT * FROM EmailEvents
//         WHERE EventId = @eventId
//       `);

//     return result.recordset[0] || null;
//   } catch (error) {
//     logger.error("Error fetching email event:", error);
//     throw error;
//   }
// };