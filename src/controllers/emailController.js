import { v4 as uuidv4 } from "uuid";
import { publishEmailEvent } from "../services/sqsService.js";
import { saveEmailEvent, getEmailEventById } from "../services/emailEventService.js";
import { emailTemplates } from "../services/emailTemplates.js";
import { ok, fail, serverError } from "../utils/response.js";
import logger from "../utils/logger.js";

export const sendWelcomeEmail = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const userId = req.account.id;
    const email = req.account.email;

    if (!email) {
      return fail(res, "Email address not found", 400);
    }

    const eventId = uuidv4();
    const template = emailTemplates.userWelcome({
      firstName: firstName || req.account.firstName || "User",
      lastName: lastName || req.account.lastName || "",
    });

    const emailData = {
      eventId,
      userId,
      toEmail: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      templateName: "USER_WELCOME",
    };

    // Save to database
    await saveEmailEvent(emailData);

    // Publish to SQS
    await publishEmailEvent(emailData);

    return ok(res, { eventId }, "Welcome email queued successfully");
  } catch (error) {
    logger.error("Error in sendWelcomeEmail:", error);
    return serverError(res, error.message);
  }
};

export const sendBookingConfirmation = async (req, res) => {
  try {
    const { bookingId, className, trainerName, classDateTime, status } = req.body;
    const userId = req.account.id;
    const email = req.account.email;

    if (!email || !bookingId) {
      return fail(res, "Missing required fields", 400);
    }

    const eventId = uuidv4();
    const template = emailTemplates.bookingConfirmation({
      bookingId,
      className,
      trainerName,
      classDateTime,
      status,
      userName: `${req.account.firstName || "User"} ${req.account.lastName || ""}`,
    });

    const emailData = {
      eventId,
      userId,
      toEmail: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      templateName: "BOOKING_CONFIRMATION",
    };

    await saveEmailEvent(emailData);
    await publishEmailEvent(emailData);

    return ok(res, { eventId }, "Booking confirmation email queued");
  } catch (error) {
    logger.error("Error in sendBookingConfirmation:", error);
    return serverError(res, error.message);
  }
};

export const sendPaymentConfirmation = async (req, res) => {
  try {
    const { transactionId, amount, paymentMethod, paymentDateTime } = req.body;
    const userId = req.account.id;
    const email = req.account.email;

    if (!email || !transactionId) {
      return fail(res, "Missing required fields", 400);
    }

    const eventId = uuidv4();
    const template = emailTemplates.paymentConfirmation({
      transactionId,
      amount,
      paymentMethod,
      paymentDateTime,
      userName: `${req.account.firstName || "User"} ${req.account.lastName || ""}`,
    });

    const emailData = {
      eventId,
      userId,
      toEmail: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      templateName: "PAYMENT_CONFIRMATION",
    };

    await saveEmailEvent(emailData);
    await publishEmailEvent(emailData);

    return ok(res, { eventId }, "Payment confirmation email queued");
  } catch (error) {
    logger.error("Error in sendPaymentConfirmation:", error);
    return serverError(res, error.message);
  }
};

export const sendClassNotification = async (req, res) => {
  try {
    const { classId, className, description, trainerName, category, price } =
      req.body;
    const userId = req.account.id;
    const email = req.account.email;

    if (!email || !classId) {
      return fail(res, "Missing required fields", 400);
    }

    const eventId = uuidv4();
    const template = emailTemplates.classNotification({
      classId,
      className,
      description,
      trainerName,
      category,
      price,
      userName: `${req.account.firstName || "User"} ${req.account.lastName || ""}`,
    });

    const emailData = {
      eventId,
      userId,
      toEmail: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      templateName: "CLASS_NOTIFICATION",
    };

    await saveEmailEvent(emailData);
    await publishEmailEvent(emailData);

    return ok(res, { eventId }, "Class notification email queued");
  } catch (error) {
    logger.error("Error in sendClassNotification:", error);
    return serverError(res, error.message);
  }
};

export const sendBookingCancellation = async (req, res) => {
  try {
    const { bookingId, className, reason } = req.body;
    const userId = req.account.id;
    const email = req.account.email;

    if (!email || !bookingId) {
      return fail(res, "Missing required fields", 400);
    }

    const eventId = uuidv4();
    const template = emailTemplates.bookingCancellation({
      bookingId,
      className,
      reason: reason || "No reason provided",
      userName: `${req.account.firstName || "User"} ${req.account.lastName || ""}`,
    });

    const emailData = {
      eventId,
      userId,
      toEmail: email,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      templateName: "BOOKING_CANCELLATION",
    };

    await saveEmailEvent(emailData);
    await publishEmailEvent(emailData);

    return ok(res, { eventId }, "Cancellation email queued");
  } catch (error) {
    logger.error("Error in sendBookingCancellation:", error);
    return serverError(res, error.message);
  }
};

export const getEmailStatus = async (req, res) => {
  try {
    const { eventId } = req.params;

    const emailEvent = await getEmailEventById(eventId);

    if (!emailEvent) {
      return fail(res, "Email event not found", 404);
    }

    return ok(res, emailEvent, "Email status retrieved");
  } catch (error) {
    logger.error("Error in getEmailStatus:", error);
    return serverError(res, error.message);
  }
};