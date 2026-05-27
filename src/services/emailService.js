// import AWS from "aws-sdk";
// import logger from "../utils/logger.js";

// AWS.config.update({ region: process.env.AWS_REGION });
// const ses = new AWS.SES({ apiVersion: "2010-12-01" });

// export const sendEmail = async (emailParams) => {
//   const {
//     toEmail,
//     subject,
//     htmlBody,
//     textBody,
//     templateName = null,
//     templateData = null,
//   } = emailParams;

//   try {
//     let params;

//     if (templateName && templateData) {
//       // Using SES template
//       params = {
//         Source: process.env.SES_SENDER_EMAIL,
//         Destination: { ToAddresses: [toEmail] },
//         Template: templateName,
//         TemplateData: JSON.stringify(templateData),
//       };

//       const result = await ses.sendTemplatedEmail(params).promise();
//       logger.info(`Template email sent: ${result.MessageId}`);
//       return result;
//     } else {
//       // Regular email
//       params = {
//         Source: process.env.SES_SENDER_EMAIL,
//         Destination: { ToAddresses: [toEmail] },
//         Message: {
//           Subject: { Data: subject, Charset: "UTF-8" },
//           Body: {
//             Html: { Data: htmlBody, Charset: "UTF-8" },
//             Text: { Data: textBody, Charset: "UTF-8" },
//           },
//         },
//       };

//       const result = await ses.sendEmail(params).promise();
//       logger.info(`Email sent: ${result.MessageId}`);
//       return result;
//     }
//   } catch (error) {
//     logger.error("Error sending email via SES:", error);
//     throw error;
//   }
// };