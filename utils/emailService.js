import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: process.env.NODE_ENV !== "production",
  logger: process.env.NODE_ENV !== "production",
});

if (process.env.NODE_ENV !== "production") {
  transporter.verify(function (error, success) {
    if (error) {
      console.log("SMTP server connection error:", error);
    } else {
      console.log("SMTP server connection successful");
      console.log("Email service:", process.env.EMAIL_SERVICE);
      console.log("Email user:", process.env.EMAIL_USER);
    }
  });
}

/**
 * Send verification email with OTP
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Verification token/code
 * @returns {Promise<boolean>} - Success status
 */
export const sendVerificationEmail = async (to, name, token) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: "Together App - Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #0891b2; text-align: center;">Welcome to Together App!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for signing up. Please verify your email address by entering the verification code below in the app:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${token}
          </div>
          <p>This verification code will expire in 1 hour.</p>
          <p>If you did not sign up for an account, please ignore this email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
            &copy; ${new Date().getFullYear()} Together App. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};

/**
 * Generate a random 6-digit verification code
 * @returns {string} - 6-digit code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
