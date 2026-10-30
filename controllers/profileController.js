/*
  Jail Management System (JMS) - XianFire Framework
  Administrator Profile Controller
*/
import bcrypt from "bcrypt";
import { User } from "../models/userModel.js";
import { AuditLog } from "../models/auditLogModel.js";
import { logAudit } from "../services/auditService.js";

/**
 * Display Admin Profile Page
 */
export const profilePage = async (req, res) => {
  try {
    const admin = await User.findByPk(req.session.userId);

    if (!admin) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    const recentLogins = await AuditLog.findAll({
      where: {
        user_id: admin.id,
        action: "LOGIN_SUCCESS"
      },
      order: [["createdAt", "DESC"]],
      limit: 5
    });

    res.render("profile/index", {
      title: "Administrator Profile | JMS Administrator",
      admin,
      recentLogins
    });
  } catch (error) {
    console.error("Profile page error:", error);
    req.flash("error_msg", "Error loading profile.");
    res.redirect("/dashboard");
  }
};

/**
 * Update Profile Details (Name, Phone, Email)
 */
export const updateProfile = async (req, res) => {
  const { name, phone, email } = req.body;

  try {
    const admin = await User.findByPk(req.session.userId);

    if (!admin) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    const oldValues = { name: admin.name, email: admin.email, phone: admin.phone };

    if (name) admin.name = name.trim();
    if (phone) admin.phone = phone.trim();
    if (email && email.trim() !== admin.email) {
      const emailCheck = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (emailCheck && emailCheck.id !== admin.id) {
        req.flash("error_msg", "Email address is already in use by another account.");
        return res.redirect("/profile");
      }
      admin.email = email.trim().toLowerCase();
    }

    await admin.save();

    // Update session
    req.session.user.name = admin.name;
    req.session.user.email = admin.email;
    req.session.user.phone = admin.phone;

    await logAudit(req, {
      action: "ADMIN_PROFILE_UPDATED",
      description: `Administrator ${admin.name} updated profile details`,
      affected_table: "users",
      affected_id: admin.id,
      old_values: oldValues,
      new_values: { name: admin.name, email: admin.email, phone: admin.phone }
    });

    req.flash("success_msg", "Administrator profile successfully updated.");
    res.redirect("/profile");
  } catch (error) {
    console.error("Update profile error:", error);
    req.flash("error_msg", "Failed to update profile.");
    res.redirect("/profile");
  }
};

/**
 * Change Administrator Password
 */
export const changePassword = async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    req.flash("error_msg", "All password fields are required.");
    return res.redirect("/profile");
  }

  if (new_password.length < 8) {
    req.flash("error_msg", "New password must be at least 8 characters long.");
    return res.redirect("/profile");
  }

  if (new_password !== confirm_password) {
    req.flash("error_msg", "New password and confirmation do not match.");
    return res.redirect("/profile");
  }

  try {
    const admin = await User.findByPk(req.session.userId);

    if (!admin) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(current_password, admin.password);
    if (!isMatch) {
      req.flash("error_msg", "Current password entered is incorrect.");
      return res.redirect("/profile");
    }

    const hashed = await bcrypt.hash(new_password, 10);
    admin.password = hashed;
    await admin.save();

    await logAudit(req, {
      action: "ADMIN_PASSWORD_CHANGED",
      description: `Administrator ${admin.name} successfully changed account password`,
      affected_table: "users",
      affected_id: admin.id
    });

    req.flash("success_msg", "Security password updated successfully.");
    res.redirect("/profile");
  } catch (error) {
    console.error("Change password error:", error);
    req.flash("error_msg", "Failed to update password.");
    res.redirect("/profile");
  }
};

export default {
  profilePage,
  updateProfile,
  changePassword
};

