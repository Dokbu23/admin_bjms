/*
  Jail Management System (JMS) - XianFire Framework
  Authentication & Admin Protection Middleware
*/
import { User } from "../models/userModel.js";

/**
 * Middleware ensuring user is authenticated and is a System Administrator.
 */
export async function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.flash("error_msg", "Please sign in to access the System Administrator portal.");
    return res.redirect("/login");
  }

  try {
    const user = await User.findByPk(req.session.userId);

    if (!user) {
      req.session.destroy();
      return res.redirect("/login");
    }

    // Enforce System Administrator role only
    if (user.role !== "admin") {
      req.session.destroy();
      req.flash("error_msg", "Access restricted: Only System Administrators may access this system.");
      return res.redirect("/login");
    }

    // Check account status
    if (user.status === "inactive") {
      req.session.destroy();
      req.flash("error_msg", "Your administrator account has been deactivated. Please contact the senior administrator.");
      return res.redirect("/login");
    }

    if (user.status === "locked") {
      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        req.session.destroy();
        req.flash("error_msg", `Your account is temporarily locked until ${new Date(user.locked_until).toLocaleTimeString()}.`);
        return res.redirect("/login");
      } else {
        // Unlock if lockout window passed
        user.status = "active";
        user.failed_attempts = 0;
        user.locked_until = null;
        await user.save();
      }
    }

    // Refresh session data
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      avatar: user.avatar
    };

    res.locals.currentUser = req.session.user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.redirect("/login");
  }
}

/**
 * Middleware redirecting already logged-in admins away from login/guest pages.
 */
export function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.userId && req.session.user && req.session.user.role === "admin") {
    return res.redirect("/dashboard");
  }
  next();
}

export default {
  requireAdmin,
  redirectIfAuthenticated
};

