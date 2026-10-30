/*
  Jail Management System (JMS) - XianFire Framework
  Database Backup Management Controller
*/
import fs from "fs";
import path from "path";
import { DatabaseBackup } from "../models/backupModel.js";
import { createBackup, restoreBackup } from "../services/backupService.js";
import { logAudit } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

/**
 * List Database Backups
 */
export const listBackups = async (req, res) => {
  try {
    const backups = await DatabaseBackup.findAll({
      order: [["createdAt", "DESC"]]
    });

    res.render("backups/index", {
      title: "Database Backup Management | JMS Administrator",
      backups
    });
  } catch (error) {
    console.error("List backups error:", error);
    req.flash("error_msg", "Error loading database backup records.");
    res.redirect("/dashboard");
  }
};

/**
 * Trigger New Database Backup
 */
export const triggerBackup = async (req, res) => {
  const { notes, backup_type } = req.body;
  const adminName = req.session.user ? req.session.user.name : "System Administrator";

  try {
    const result = await createBackup({
      type: backup_type || "Manual",
      notes: notes || "Manual administrative backup triggered from panel",
      createdBy: adminName
    });

    await logAudit(req, {
      action: "DATABASE_BACKUP_CREATED",
      description: `Created database backup archive ${result.backup.filename} (${(result.backup.file_size / 1024).toFixed(1)} KB)`,
      affected_table: "database_backups",
      affected_id: result.backup.id,
      new_values: {
        filename: result.backup.filename,
        file_size: result.backup.file_size
      }
    });

    await createNotification({
      title: "Database Backup Completed",
      message: `Full database archive ${result.backup.filename} generated successfully.`,
      type: "backup",
      link: "/backups"
    });

    req.flash("success_msg", `Database backup generated successfully: ${result.backup.filename}`);
    res.redirect("/backups");
  } catch (error) {
    console.error("Backup creation error:", error);
    req.flash("error_msg", "Database backup failed: " + error.message);
    res.redirect("/backups");
  }
};

/**
 * Securely Download Backup File
 */
export const downloadBackup = async (req, res) => {
  const { id } = req.params;

  try {
    const backup = await DatabaseBackup.findByPk(id);

    if (!backup) {
      req.flash("error_msg", "Backup record not found.");
      return res.redirect("/backups");
    }

    if (!fs.existsSync(backup.filepath)) {
      req.flash("error_msg", "Physical backup file not found on disk.");
      return res.redirect("/backups");
    }

    await logAudit(req, {
      action: "DATABASE_BACKUP_DOWNLOAD",
      description: `Administrator downloaded database backup ${backup.filename}`,
      affected_table: "database_backups",
      affected_id: backup.id
    });

    res.download(backup.filepath, backup.filename);
  } catch (error) {
    console.error("Download backup error:", error);
    req.flash("error_msg", "Failed to download backup file.");
    res.redirect("/backups");
  }
};

/**
 * Restore Database from Backup
 */
export const restoreBackupAction = async (req, res) => {
  const { id } = req.params;
  const { confirmation } = req.body;

  if (confirmation !== "RESTORE") {
    req.flash("error_msg", "Restoration confirmation code did not match. Please type RESTORE to confirm.");
    return res.redirect("/backups");
  }

  try {
    const backup = await DatabaseBackup.findByPk(id);

    if (!backup) {
      req.flash("error_msg", "Backup file not found.");
      return res.redirect("/backups");
    }

    await restoreBackup(id);

    await logAudit(req, {
      action: "DATABASE_RESTORED",
      description: `CRITICAL ACTION: Database restored from backup archive ${backup.filename}`,
      affected_table: "database_backups",
      affected_id: backup.id
    });

    await createNotification({
      title: "Database Restored",
      message: `Database was successfully restored from backup ${backup.filename} by System Administrator.`,
      type: "security",
      link: "/backups"
    });

    req.flash("success_msg", `Database successfully restored from backup: ${backup.filename}`);
    res.redirect("/backups");
  } catch (error) {
    console.error("Restore backup error:", error);
    req.flash("error_msg", "Database restoration failed: " + error.message);
    res.redirect("/backups");
  }
};

/**
 * Delete Backup File
 */
export const deleteBackup = async (req, res) => {
  const { id } = req.params;

  try {
    const backup = await DatabaseBackup.findByPk(id);

    if (!backup) {
      req.flash("error_msg", "Backup record not found.");
      return res.redirect("/backups");
    }

    if (fs.existsSync(backup.filepath)) {
      try {
        fs.unlinkSync(backup.filepath);
      } catch (e) {
        console.warn("Notice: file unlink error:", e.message);
      }
    }

    const filename = backup.filename;
    await backup.destroy();

    await logAudit(req, {
      action: "DATABASE_BACKUP_DELETED",
      description: `Administrator removed database backup archive ${filename}`,
      affected_table: "database_backups",
      affected_id: id
    });

    req.flash("success_msg", `Backup archive ${filename} removed.`);
    res.redirect("/backups");
  } catch (error) {
    console.error("Delete backup error:", error);
    req.flash("error_msg", "Failed to delete backup.");
    res.redirect("/backups");
  }
};

export default {
  listBackups,
  triggerBackup,
  downloadBackup,
  restoreBackupAction,
  deleteBackup
};

