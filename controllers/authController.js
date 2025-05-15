import User from "../models/userModel.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import {
  sendVerificationEmail,
  generateVerificationCode,
} from "../utils/emailService.js";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from "../utils/validation.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error(
    "FATAL ERROR: JWT_SECRET is not defined in environment variables"
  );
  process.exit(1);
}

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
        field: "email",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
        field: "password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      if (
        !user.emailVerificationToken ||
        new Date() > user.emailVerificationTokenExpires
      ) {
        const verificationToken = generateVerificationCode();
        const tokenExpiration = new Date();
        tokenExpiration.setHours(tokenExpiration.getHours() + 1);

        user.emailVerificationToken = verificationToken;
        user.emailVerificationTokenExpires = tokenExpiration;
        await user.save();

        await sendVerificationEmail(user.email, user.name, verificationToken);
      }

      return res.status(403).json({
        success: false,
        message:
          "Email not verified. A verification code has been sent to your email.",
        requiresVerification: true,
        userId: user._id,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "28d",
    });

    user.lastOnline = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
        field: "name",
      });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
        field: "email",
      });
    }

    const emailDomain = email.split("@")[1];
    if (!validator.isFQDN(emailDomain)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email domain",
        field: "email",
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
        field: "password",
      });
    }

    if (confirmPassword !== undefined) {
      const passwordMatchValidation = validatePasswordMatch(
        password,
        confirmPassword
      );
      if (!passwordMatchValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: passwordMatchValidation.message,
          field: "confirmPassword",
        });
      }
    }

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const verificationToken = generateVerificationCode();
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 1);

    const newUser = new User({
      name,
      email,
      password,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpires: tokenExpiration,
    });

    await newUser.save();

    const emailSent = await sendVerificationEmail(
      email,
      name,
      verificationToken
    );

    if (!emailSent) {
      console.error("Failed to send verification email");
    }

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profileImageUrl: newUser.profileImageUrl,
        isEmailVerified: false,
      },
      message:
        "Registration successful! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration Error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

export const verifyEmail = async (req, res) => {
  const { userId, verificationCode } = req.body;

  if (!userId || !verificationCode) {
    return res.status(400).json({
      success: false,
      message: "User ID and verification code are required",
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
        isEmailVerified: true,
      });
    }

    if (user.emailVerificationToken !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (new Date() > user.emailVerificationTokenExpires) {
      const newToken = generateVerificationCode();
      const tokenExpiration = new Date();
      tokenExpiration.setHours(tokenExpiration.getHours() + 1);

      user.emailVerificationToken = newToken;
      user.emailVerificationTokenExpires = tokenExpiration;
      await user.save();

      await sendVerificationEmail(user.email, user.name, newToken);

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. A new code has been sent to your email.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "28d",
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      isEmailVerified: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error("Verification Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
        field: "email",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If your email exists in our system, a verification code has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
      });
    }

    const verificationToken = generateVerificationCode();
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 1);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationTokenExpires = tokenExpiration;
    await user.save();

    await sendVerificationEmail(user.email, user.name, verificationToken);

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error("Resend Verification Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while sending verification email",
    });
  }
};
