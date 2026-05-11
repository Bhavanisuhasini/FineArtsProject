import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger.js";

// Validate environment variables
const validateEnvVariables = () => {
  const required = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "SQS_QUEUE_URL",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

try {
  validateEnvVariables();
  console.log("✅ All AWS environment variables loaded");
} catch (error) {
  console.error("❌", error.message);
  process.exit(1);
}

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sqs = new AWS.SQS();

export const publishEmailEvent = async (emailData) => {
  try {
    if (!process.env.SQS_QUEUE_URL) {
      throw new Error("SQS_QUEUE_URL is undefined");
    }

    const params = {
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        ...emailData,
      }),
    };

    const result = await sqs.sendMessage(params).promise();
    logger.info(`Message sent to SQS: ${result.MessageId}`);
    return result;
  } catch (error) {
    logger.error("Error publishing to SQS:", error.message);
    throw error;
  }
};

export const receiveMessages = async () => {
  try {
    if (!process.env.SQS_QUEUE_URL) {
      throw new Error("SQS_QUEUE_URL is undefined");
    }

    const params = {
      QueueUrl: process.env.SQS_QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    };

    const data = await sqs.receiveMessage(params).promise();
    return data.Messages || [];
  } catch (error) {
    logger.error("Error receiving messages from SQS:", error.message);
    throw error;
  }
};

export const deleteMessage = async (receiptHandle) => {
  try {
    if (!process.env.SQS_QUEUE_URL) {
      throw new Error("SQS_QUEUE_URL is undefined");
    }

    const params = {
      QueueUrl: process.env.SQS_QUEUE_URL,
      ReceiptHandle: receiptHandle,
    };

    await sqs.deleteMessage(params).promise();
    logger.info("Message deleted from SQS");
  } catch (error) {
    logger.error("Error deleting message from SQS:", error.message);
    throw error;
  }
};