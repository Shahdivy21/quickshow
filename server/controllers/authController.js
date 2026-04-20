// ---------------------
// authController.js
// ---------------------
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../configs/nodemailer.js";
import path from "path";

// ---------------------
// Register
// ---------------------
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle profile picture upload
    let profilePic = "";
    if (req.file) {
      profilePic = `/uploads/${req.file.filename}`;
    }

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      profilePic,
    });
    await user.save();

    // Generate token for email verification
    const verifyToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const verifyUrl = `${process.env.CLIENT_URL}/verify-account?token=${verifyToken}`;

    // Send verification email
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "✅ Verify your QuickShow account",
      html: `
        <h2>Hello ${name},</h2>
        <p>Thank you for registering at QuickShow!</p>
        <p>Click the button below to verify your account:</p>
        <a href="${verifyUrl}" style="
          display:inline-block;
          padding:10px 20px;
          margin-top:10px;
          background-color:#FF0080;
          color:#fff;
          border-radius:5px;
          text-decoration:none;
          font-weight:bold;
        ">Verify Account</a>
        <p>If you didn’t register, ignore this email.</p>
        <br/>
        <p>QuickShow Team</p>
      `,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please check your email to verify your account.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------------
// Verify Account (via email link)
// ---------------------
export const verifyAccount = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isAccountVerified) return res.status(400).json({ success: false, message: "Account already verified" });

    user.isAccountVerified = true;
    await user.save();

    // Redirect to frontend verified-success page
    return res.redirect(`${process.env.CLIENT_URL}/verified-success`);
  } catch (error) {
    console.error("VerifyAccount error:", error);
    return res.status(500).json({ success: false, message: "Invalid or expired token" });
  }
};

// ---------------------
// Login
// ---------------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ success: false, message: "All fields are required" });

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid email or password" });

    // if (!user.isAccountVerified) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Please verify your email before logging in.",
    //   });
    // }


    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      path: "/",
      overwrite: true,
      maxAge: 24 * 60 * 60 * 1000, 
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAccountVerified: user.isAccountVerified,
        profilePic: user.profilePic || "",
        isAdmin: user.isAdmin || false
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------
// Logout
// ---------------------
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      path: "/",
    });
    return res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------
// Is Authenticated
// ---------------------
export const isAuthenticated = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });

    const user = await userModel.findById(userId).select("name email isAccountVerified profilePic isAdmin");
    
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------
// Resend Verification Email
// ---------------------
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isAccountVerified) {
      return res.status(400).json({ success: false, message: "Account already verified" });
    }

    // Generate new verify token
    const verifyToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const verifyUrl = `${process.env.CLIENT_URL}/verify-account?token=${verifyToken}`;

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "📩 Resend - Verify your QuickShow account",
      html: `
        <h2>Hello ${user.name},</h2>
        <p>You requested a new verification link.</p>
        <p>Click the button below to verify your account:</p>
        <a href="${verifyUrl}" style="
          display:inline-block;
          padding:10px 20px;
          margin-top:10px;
          background-color:#FF0080;
          color:#fff;
          border-radius:5px;
          text-decoration:none;
          font-weight:bold;
        ">Verify Account</a>
        <p>If you didn’t request this, ignore this email.</p>
        <br/>
        <p>QuickShow Team</p>
      `,
    });

    return res.status(200).json({ success: true, message: "Verification email resent" });
  } catch (error) {
    console.error("ResendVerification error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



// ---------------------
// Send Reset OTP (for password reset)
// ---------------------
export const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "🔑 Reset your QuickShow password",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #F84565; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">🔑 Password Reset OTP</h2>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
            <p style="font-size: 16px;">We received a request to reset your QuickShow account password. Please use the following One-Time Password (OTP) to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #F84565; background-color: #fce7eb; padding: 15px 25px; border-radius: 8px; border: 1px dashed #F84565;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #555;">This OTP is valid for <strong>15 minutes</strong>.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div style="background-color: #f3f4f6; color: #555; padding: 15px; text-align: center; font-size: 12px;">
            QuickShow &copy; ${new Date().getFullYear()}. All rights reserved.
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------
// Reset Password
// ---------------------
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: "All fields are required" });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });
    if (user.resetOtp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (user.resetOtpExpireAt < Date.now()) return res.status(400).json({ success: false, message: "OTP expired" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
