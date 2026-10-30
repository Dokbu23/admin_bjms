/*
  Jail Management System (JMS) - XianFire Framework
  Authentication Controller (System Administrator Only)
*/
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Op } from "sequelize";
import { User } from "../models/userModel.js";
import { FacilitySetting } from "../models/settingModel.js";
import { PasswordResetToken } from "../models/passwordResetModel.js";
import { logAudit } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

// Helper to fetch setting with fallback
async function getSetting(key, fallback = null) {
  try {
    const s = await FacilitySetting.findOne({ where: { key } });
    return s ? s.value : fallback;
  } catch (_) {
    return fallback;
  }
}

/**
 * Display Admin Login Page
 */
export const loginPage = async (req, res) => {
  const facilityName = await getSetting("facility_name", "Metropolitan Regional Correctional Facility");
  const systemName = await getSetting("system_name", "Jail Management System");
  const motto = await getSetting("system_motto", "Securing Persons Deprived of Liberty with Human Dignity");

  res.render("login", {
    title: "System Administrator Login | JMS",
    facilityName,
    systemName,
    motto,
    layout: false
  });
};

/**
 * Handle Administrator Login
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "Unknown";

  if (!email || !password) {
    req.flash("error_msg", "Please provide both administrative email and password.");
    return res.redirect("/login");
  }

  try {
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    if (!user) {
      await logAudit(req, {
        action: "LOGIN_FAILED",
        description: `Failed login attempt with unregistered email: ${email}`,
        affected_table: "users"
      });
      req.flash("error_msg", "Invalid administrator credentials.");
      return res.redirect("/login");
    }

    // STRICT RULE: Only System Administrator role can authenticate
    if (user.role !== "admin") {
      await logAudit(req, {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        action: "UNAUTHORIZED_LOGIN_ATTEMPT",
        description: `Non-administrator account (${user.role}) denied system access.`,
        affected_table: "users",
        affected_id: user.id
      });
      await createNotification({
        title: "Unauthorized Login Attempt",
        message: `Personnel account (${user.email}) attempted to access the Administrator Portal.`,
        type: "security"
      });
      req.flash("error_msg", "Access restricted: Only System Administrators may access this portal.");
      return res.redirect("/login");
    }

    // Check account status
    if (user.status === "inactive") {
      req.flash("error_msg", "This administrator account is currently inactive. Contact your facility director.");
      return res.redirect("/login");
    }

    // Check temporary lockout
    const maxAttempts = parseInt(await getSetting("max_login_attempts", "5"), 10);
    const lockoutMinutes = parseInt(await getSetting("lockout_duration_minutes", "15"), 10);

    if (user.status === "locked") {
      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
        req.flash("error_msg", `Account locked due to multiple failed attempts. Try again in ${remainingMinutes} minute(s).`);
        return res.redirect("/login");
      } else {
        // Unlock if duration expired
        user.status = "active";
        user.failed_attempts = 0;
        user.locked_until = null;
        await user.save();
      }
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failed_attempts = (user.failed_attempts || 0) + 1;

      if (user.failed_attempts >= maxAttempts) {
        user.status = "locked";
        user.locked_until = new Date(Date.now() + lockoutMinutes * 60 * 1000);
        await user.save();

        await logAudit(req, {
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          action: "ACCOUNT_LOCKED",
          description: `Administrator account locked for ${lockoutMinutes} mins after ${user.failed_attempts} failed login attempts.`,
          affected_table: "users",
          affected_id: user.id
        });

        await createNotification({
          title: "Administrator Account Locked",
          message: `Account ${user.email} locked after ${maxAttempts} consecutive failed attempts from IP ${ip}.`,
          type: "security"
        });

        req.flash("error_msg", `Account temporarily locked for ${lockoutMinutes} minutes due to multiple failed login attempts.`);
        return res.redirect("/login");
      }

      await user.save();

      await logAudit(req, {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        action: "LOGIN_FAILED",
        description: `Failed password attempt (${user.failed_attempts}/${maxAttempts}) for administrator ${user.email}`,
        affected_table: "users",
        affected_id: user.id
      });

      req.flash("error_msg", `Invalid administrator credentials. (${maxAttempts - user.failed_attempts} attempt(s) remaining before temporary lockout)`);
      return res.redirect("/login");
    }

    // Successful Login
    user.failed_attempts = 0;
    user.locked_until = null;
    user.last_login_at = new Date();
    user.last_login_ip = ip.replace("::ffff:", "");
    await user.save();

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      avatar: user.avatar
    };

    await logAudit(req, {
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      action: "LOGIN_SUCCESS",
      description: `Administrator ${user.name} logged in successfully`,
      affected_table: "users",
      affected_id: user.id
    });

    req.flash("success_msg", `Welcome back, ${user.name}!`);
    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Login Error:", error);
    req.flash("error_msg", "A server error occurred during authentication. Please try again.");
    return res.redirect("/login");
  }
};

/**
 * Handle Administrator Logout
 */
export const logoutUser = async (req, res) => {
  if (req.session && req.session.user) {
    await logAudit(req, {
      action: "LOGOUT",
      description: `Administrator ${req.session.user.name} logged out securely`,
      affected_table: "users",
      affected_id: req.session.user.id
    });
  }

  req.session.destroy(err => {
    if (err) console.error("Session destroy error:", err);
    res.redirect("/login");
  });
};

/**
 * Display Forgot Password Page
 */
export const forgotPasswordPage = async (req, res) => {
  const facilityName = await getSetting("facility_name", "Metropolitan Regional Correctional Facility");
  res.render("forgotpassword", {
    title: "Reset Password | JMS Administrator",
    facilityName,
    layout: false
  });
};

/**
 * Process Forgot Password Request
 */
export const sendResetToken = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    req.flash("error_msg", "Please provide your official administrator email.");
    return res.redirect("/forgot-password");
  }

  try {
    const user = await User.findOne({ where: { email: email.trim().toLowerCase(), role: "admin" } });

    if (!user) {
      req.flash("error_msg", "If an administrator account exists with that email, a password reset link has been dispatched.");
      return res.redirect("/forgot-password");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      email: user.email,
      token,
      expires_at: expiresAt
    });

    await logAudit(req, {
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      action: "PASSWORD_RESET_REQUEST",
      description: `Password reset requested for administrator ${user.email}`,
      affected_table: "password_reset_tokens"
    });

    await createNotification({
      title: "Password Reset Requested",
      message: `A security password reset token was generated for administrator ${user.email}.`,
      type: "security"
    });

    // Provide reset link directly on screen for testing convenience
    req.flash("success_msg", `Password reset token generated! You can reset your password now.`);
    return res.redirect(`/reset-password/${token}`);
  } catch (error) {
    console.error("Forgot password error:", error);
    req.flash("error_msg", "An error occurred while processing your request.");
    return res.redirect("/forgot-password");
  }
};

/**
 * Display Reset Password Form
 */
export const resetPasswordPage = async (req, res) => {
  const { token } = req.params;

  try {
    const resetRecord = await PasswordResetToken.findOne({
      where: {
        token,
        used: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!resetRecord) {
      req.flash("error_msg", "Password reset token is invalid or has expired.");
      return res.redirect("/forgot-password");
    }

    res.render("resetpassword", {
      title: "Create New Password | JMS Administrator",
      token,
      email: resetRecord.email,
      layout: false
    });
  } catch (error) {
    req.flash("error_msg", "Error verifying reset token.");
    res.redirect("/forgot-password");
  }
};

/**
 * Handle Reset Password Submission
 */
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirm_password } = req.body;

  if (!password || password.length < 8) {
    req.flash("error_msg", "Password must be at least 8 characters long.");
    return res.redirect(`/reset-password/${token}`);
  }

  if (password !== confirm_password) {
    req.flash("error_msg", "Passwords do not match.");
    return res.redirect(`/reset-password/${token}`);
  }

  try {
    const resetRecord = await PasswordResetToken.findOne({
      where: {
        token,
        used: false,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!resetRecord) {
      req.flash("error_msg", "Reset token is invalid or expired.");
      return res.redirect("/forgot-password");
    }

    const user = await User.findOne({ where: { email: resetRecord.email } });
    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.failed_attempts = 0;
    user.status = "active";
    user.locked_until = null;
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    await logAudit(req, {
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      action: "PASSWORD_RESET_COMPLETED",
      description: `Administrator ${user.email} successfully updated their password via reset token`,
      affected_table: "users",
      affected_id: user.id
    });

    req.flash("success_msg", "Your administrator password has been reset successfully. Please log in.");
    return res.redirect("/login");
  } catch (error) {
    console.error("Reset password error:", error);
    req.flash("error_msg", "An error occurred while resetting your password.");
    return res.redirect(`/reset-password/${token}`);
  }
};

export default {
  loginPage,
  loginUser,
  logoutUser,
  forgotPasswordPage,
  sendResetToken,
  resetPasswordPage,
  resetPassword
};
