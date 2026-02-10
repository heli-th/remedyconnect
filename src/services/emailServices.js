const nodemailer = require("nodemailer");

/**
 * Sends an email using Gmail SMTP.
 *
 * @param {Object} options
 * @param {string} options.toMail - Recipient email address.
 * @param {string} options.fromMail - Sender email address.
 * @param {string} options.subject - Email subject line.
 * @param {string} options.body - Email body (HTML or plain text).
 */

const sendMail = async ({ toMail, fromMail, subject, body }) => {
  try {
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "content@remedyconnect.com",
        pass: "fons ylwj ozro aitp",
      },
    });

    // Email options
    const mailOptions = {
      from: fromMail || "content@remedyconnect.com",
      to: toMail,
      subject: subject,
      html: body,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    return "Email sent successfully";
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Failed to send email");
  }
};


function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

module.exports = { sendMail, isEmail };