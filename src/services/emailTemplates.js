// export const emailTemplates = {
//   // ✅ Welcome email after signup
//   userWelcome: (userData) => ({
//     subject: `Welcome to FineArts Academy, ${userData.firstName}! 🎨`,
//     htmlBody: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
//         <h1 style="color: #333;">Welcome to FineArts Academy!</h1>
//         <p style="color: #666; font-size: 16px;">Dear ${userData.firstName} ${userData.lastName},</p>
//         <p style="color: #666; font-size: 16px;">Thank you for signing up! We're excited to have you join our community of fine arts enthusiasts.</p>
//         <p style="color: #666; font-size: 16px;">Start exploring classes, connect with trainers, and grow your artistic skills.</p>
//         <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
//           Go to Dashboard
//         </a>
//         <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't sign up, please ignore this email.</p>
//       </div>
//     `,
//     textBody: `Welcome to FineArts Academy! Start exploring at ${process.env.FRONTEND_URL}/dashboard`,
//   }),

//   // ✅ Email verification
//   emailVerification: (userData) => ({
//     subject: `Verify Your Email - FineArts Academy`,
//     htmlBody: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//         <h2>Verify Your Email</h2>
//         <p>Click the link below to verify your email address:</p>
//         <a href="${process.env.FRONTEND_URL}/verify/${userData.verificationToken}" 
//            style="display: inline-block; background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
//           Verify Email
//         </a>
//         <p style="color: #999; font-size: 12px; margin-top: 30px;">This link expires in 24 hours.</p>
//       </div>
//     `,
//     textBody: `Verify your email: ${process.env.FRONTEND_URL}/verify/${userData.verificationToken}`,
//   }),

//   // ✅ Booking confirmation
//   bookingConfirmation: (bookingData) => ({
//     subject: `Booking Confirmed - Class: ${bookingData.className}`,
//     htmlBody: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//         <h2>Booking Confirmed! ✅</h2>
//         <p>Dear ${bookingData.userName},</p>
//         <p>Your booking has been confirmed. Here are the details:</p>
//         <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Class Name:</td>
//             <td style="padding: 10px;">${bookingData.className}</td>
//           </tr>
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Trainer:</td>
//             <td style="padding: 10px;">${bookingData.trainerName}</td>
//           </tr>
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Date & Time:</td>
//             <td style="padding: 10px;">${bookingData.classDateTime}</td>
//           </tr>
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Status:</td>
//             <td style="padding: 10px; color: green; font-weight: bold;">${bookingData.status}</td>
//           </tr>
//         </table>
//         <a href="${process.env.FRONTEND_URL}/bookings/${bookingData.bookingId}"
//            style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
//           View Booking
//         </a>
//       </div>
//     `,
//     textBody: `Booking confirmed for ${bookingData.className} on ${bookingData.classDateTime}`,
//   }),

//   // ✅ Payment confirmation
//   paymentConfirmation: (paymentData) => ({
//     subject: `Payment Received - Transaction ID: ${paymentData.transactionId}`,
//     htmlBody: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//         <h2>Payment Confirmed! 💳</h2>
//         <p>Dear ${paymentData.userName},</p>
//         <p>Your payment has been received successfully.</p>
//         <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Transaction ID:</td>
//             <td style="padding: 10px;">${paymentData.transactionId}</td>
//           </tr>
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Amount:</td>
//             <td style="padding: 10px;">₹ ${paymentData.amount}</td>
//           </tr>
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Payment Method:</td>
//             <td style="padding: 10px;">${paymentData.paymentMethod}</td>
//           </tr>
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Date & Time:</td>
//             <td style="padding: 10px;">${paymentData.paymentDateTime}</td>
//           </tr>
//         </table>
//         <a href="${process.env.FRONTEND_URL}/payments"
//            style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
//           View Transaction
//         </a>
//       </div>
//     `,
//     textBody: `Payment confirmed. Amount: ₹ ${paymentData.amount}. Transaction ID: ${paymentData.transactionId}`,
//   }),

//   // ✅ Class notification
//   classNotification: (classData) => ({
//     subject: `New Class Available: ${classData.className}`,
//     htmlBody: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//         <h2>New Class Available! 📚</h2>
//         <p>Dear ${classData.userName},</p>
//         <p>A new class matching your interests is now available.</p>
//         <h3 style="color: #4CAF50;">${classData.className}</h3>
//         <p style="color: #666;">${classData.description}</p>
//         <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Trainer:</td>
//             <td style="padding: 10px;">${classData.trainerName}</td>
//           </tr>
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Category:</td>
//             <td style="padding: 10px;">${classData.category}</td>
//           </tr>
//           <tr style="border-bottom: 1px solid #ddd;">
//             <td style="padding: 10px; font-weight: bold;">Price:</td>
//             <td style="padding: 10px;">₹ ${classData.price}</td>
//           </tr>
//         </table>
//         <a href="${process.env.FRONTEND_URL}/classes/${classData.classId}"
//            style="display: inline-block; background-color: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
//           View Class
//         </a>
//       </div>
//     `,
//     textBody: `New class: ${classData.className} by ${classData.trainerName}. Price: ₹ ${classData.price}`,
//   }),

//   // ✅ Cancellation notification
//   bookingCancellation: (cancellationData) => ({
//     subject: `Booking Cancelled - ${cancellationData.className}`,
//     htmlBody: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//         <h2>Booking Cancelled</h2>
//         <p>Dear ${cancellationData.userName},</p>
//         <p>Your booking has been cancelled.</p>
//         <p><strong>Class:</strong> ${cancellationData.className}</p>
//         <p><strong>Reason:</strong> ${cancellationData.reason}</p>
//         <p style="color: #666;">If you have any questions, please contact support.</p>
//       </div>
//     `,
//     textBody: `Your booking for ${cancellationData.className} has been cancelled.`,
//   }),
// };