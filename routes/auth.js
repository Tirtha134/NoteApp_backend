import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/middleware.js";

const router = express.Router();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name?.trim() || !phone?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ name, phone, email, password: hashedPassword });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier?.trim() || !password) return res.status(400).json({ success: false, message: "Identifier and password required" });

    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

    // ✅ Cookies for production Render deployment
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,      // HTTPS required
      sameSite: "none",  // cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

/* ================= LOGOUT ================= */
router.get("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

/* ================= VERIFY USER ================= */
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      message: "User verified",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, password: user.password },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
});

/* ================= RESET PASSWORD ================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { identifier, newPassword } = req.body;
    if (!identifier?.trim() || !newPassword) return res.status(400).json({ success: false, message: "Identifier and new password required" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error during password reset" });
  }
});

export default router;
