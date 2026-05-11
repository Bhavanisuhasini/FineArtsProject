import dotenv from "dotenv";
dotenv.config({ path: ".env" }); // Explicitly load .env

import { receiveMessages, deleteMessage } from "../services/sqsService.js";
import { sendEmail } from "../services/emailService.js";
import { updateEmailStatus } from "../services/emailEventService.js";
import logger from "../utils/logger.js";

// Debug: Check if env variables are loaded
console.log("=".repeat(50));
console.log("🚀 Email Consumer Starting...");
console.log("=".repeat(50));
console.log("AWS_REGION:", process.env.AWS_REGION || "❌ MISSING");
console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "✅ Loaded" : "❌ MISSING");
console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "✅ Loaded" : "❌ MISSING");
console.log("SQS_QUEUE_URL:", process.env.SQS_QUEUE_URL || "❌ MISSING");
console.log("SES_SENDER_EMAIL:", process.env.SES_SENDER_EMAIL || "❌ MISSING");
console.log("=".repeat(50));

// Validate environment variables
if (!process.env.SQS_QUEUE_URL) {
  console.error("❌ FATAL ERROR: SQS_QUEUE_URL is not set!");
  console.error("Make sure your .env file contains: SQS_QUEUE_URL=https://sqs...");
  process.exit(1);
}

if (!process.env.AWS_REGION) {
  console.error("❌ FATAL ERROR: AWS_REGION is not set!");
  process.exit(1);
}

const processMessages = async () => {
  try {
    const messages = await receiveMessages();

    if (messages.length === 0) {
      logger.info("No messages in queue");
      return;
    }

    logger.info(`Processing ${messages.length} messages...`);

    for (const message of messages) {
      try {
        const emailData = JSON.parse(message.Body);
        logger.info(`Processing email: ${emailData.eventId}`);

        // Send email via SES
        const result = await sendEmail({
          toEmail: emailData.toEmail,
          subject: emailData.subject,
          htmlBody: emailData.htmlBody,
          textBody: emailData.textBody,
        });

        // Update database with success
        await updateEmailStatus(emailData.eventId, "SENT", result.MessageId);

        // Delete message from queue
        await deleteMessage(message.ReceiptHandle);

        logger.info(`✅ Email sent successfully: ${emailData.eventId}`);
      } catch (error) {
        logger.error(`❌ Error processing message: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error("Error in processMessages:", error.message);
  }
};

const startConsumer = () => {
  logger.info("🚀 Starting email consumer service...");

  // Process messages every 5 seconds
  setInterval(() => {
    processMessages();
  }, 5000);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Shutting down email consumer...");
    process.exit(0);
  });
};

startConsumer();