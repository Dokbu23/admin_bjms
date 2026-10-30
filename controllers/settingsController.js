/*
  Jail Management System (JMS) - XianFire Framework
  System & Facility Settings Controller
*/
import { FacilitySetting } from "../models/settingModel.js";
import { logAudit } from "../services/auditService.js";

/**
 * Display Settings Management Dashboard
 */
export const settingsPage = async (req, res) => {
  try {
    const allSettings = await FacilitySetting.findAll({
      order: [["group", "ASC"], ["id", "ASC"]]
    });

    const settingsMap = {};
    allSettings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    res.render("settings/index", {
      title: "System & Facility Settings | JMS Administrator",
      facilitySettings: settingsMap,
      allSettings
    });
  } catch (error) {
    console.error("Settings page error:", error);
    req.flash("error_msg", "Error loading system settings.");
    res.redirect("/dashboard");
  }
};

/**
 * Handle Settings Update
 */
export const updateSettings = async (req, res) => {
  const allowedKeys = [
    "facility_name",
    "facility_code",
    "facility_address",
    "contact_number",
    "emergency_hotline",
    "official_email",
    "warden_in_charge",
    "system_name",
    "system_motto",
    "timezone",
    "date_format",
    "session_timeout_minutes",
    "max_login_attempts",
    "lockout_duration_minutes",
    "min_password_length",
    "require_special_char",
    "backup_reminder_days"
  ];

  try {
    const updatedValues = {};

    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        const value = String(req.body[key]).trim();
        await FacilitySetting.upsert({
          key,
          value
        });
        updatedValues[key] = value;
      }
    }

    await logAudit(req, {
      action: "SETTINGS_MODIFIED",
      description: "Administrator updated system configuration and facility profile settings",
      affected_table: "facility_settings",
      affected_id: "all",
      new_values: updatedValues
    });

    req.flash("success_msg", "Facility profile and system security settings saved successfully.");
    res.redirect("/settings");
  } catch (error) {
    console.error("Update settings error:", error);
    req.flash("error_msg", "Failed to update system settings.");
    res.redirect("/settings");
  }
};

export default {
  settingsPage,
  updateSettings
};
