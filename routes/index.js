/*
  Jail Management System (JMS) - XianFire Framework
  Application Routes
*/
import express from "express";
import { requireAdmin, redirectIfAuthenticated } from "../middleware/auth.js";

// Controllers
import authController from "../controllers/authController.js";
import dashboardController from "../controllers/dashboardController.js";
import personnelController from "../controllers/personnelController.js";
import pdlController from "../controllers/pdlController.js";
import settingsController from "../controllers/settingsController.js";
import backupController from "../controllers/backupController.js";
import auditController from "../controllers/auditController.js";
import notificationController from "../controllers/notificationController.js";
import reportController from "../controllers/reportController.js";
import profileController from "../controllers/profileController.js";

const router = express.Router();

// Root route redirects to dashboard or login
router.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }
  return res.redirect("/login");
});

// ==========================================
// 1. AUTHENTICATION ROUTES (Admin Only)
// ==========================================
router.get("/login", redirectIfAuthenticated, authController.loginPage);
router.post("/login", authController.loginUser);
router.get("/logout", authController.logoutUser);

router.get("/forgot-password", redirectIfAuthenticated, authController.forgotPasswordPage);
router.post("/forgot-password", authController.sendResetToken);
router.get("/reset-password/:token", redirectIfAuthenticated, authController.resetPasswordPage);
router.post("/reset-password/:token", authController.resetPassword);

// ==========================================
// 2. PROTECTED SYSTEM ADMINISTRATOR ROUTES
// ==========================================
router.use(requireAdmin);

// Dashboard
router.get("/dashboard", dashboardController.dashboardPage);

// Personnel / User Management
router.get("/personnel", personnelController.listPersonnel);
router.get("/personnel/create", personnelController.createPersonnelPage);
router.post("/personnel", personnelController.createPersonnel);
router.get("/personnel/:id", personnelController.viewPersonnel);
router.get("/personnel/:id/edit", personnelController.editPersonnelPage);
router.post("/personnel/:id/edit", personnelController.updatePersonnel);
router.post("/personnel/:id/toggle-status", personnelController.togglePersonnelStatus);
router.post("/personnel/:id/toggle-lock", personnelController.togglePersonnelLock);
router.post("/personnel/:id/reset-password", personnelController.resetPersonnelPassword);

// PDL Records Management
router.get("/pdl", pdlController.listPdl);
router.get("/pdl/create", pdlController.createPdlPage);
router.post("/pdl", pdlController.createPdl);
router.get("/pdl/export/:format", pdlController.exportPdl);
router.get("/pdl/:id", pdlController.viewPdl);
router.get("/pdl/:id/edit", pdlController.editPdlPage);
router.post("/pdl/:id/edit", pdlController.updatePdl);
router.post("/pdl/:id/delete", pdlController.deletePdl);

// Reports Module
router.get("/reports", reportController.reportsIndex);
router.get("/reports/:type", reportController.viewReport);

// Notifications Center
router.get("/notifications", notificationController.listNotifications);
router.post("/notifications/read-all", notificationController.markAllAsRead);
router.post("/notifications/:id/read", notificationController.markAsRead);
router.get("/api/notifications/unread-count", notificationController.getUnreadCountApi);

// Audit Trail Logs
router.get("/audit-logs", auditController.listAuditLogs);
router.get("/audit-logs/export/:format", auditController.exportAuditLogs);

// Database Backup Management
router.get("/backups", backupController.listBackups);
router.post("/backups/create", backupController.triggerBackup);
router.get("/backups/:id/download", backupController.downloadBackup);
router.post("/backups/:id/restore", backupController.restoreBackupAction);
router.post("/backups/:id/delete", backupController.deleteBackup);

// System Settings
router.get("/settings", settingsController.settingsPage);
router.post("/settings", settingsController.updateSettings);

// Administrator Profile & Security
router.get("/profile", profileController.profilePage);
router.post("/profile", profileController.updateProfile);
router.post("/profile/password", profileController.changePassword);

export default router;
