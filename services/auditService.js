/*
  Jail Management System (JMS) - XianFire Framework
  Audit Logging Service
*/
import { AuditLog } from "../models/auditLogModel.js";

/**
 * Log an administrative system activity.
 * @param {Object} req Express request object
 * @param {Object} logData
 * @param {string} logData.action Action key (e.g. LOGIN_SUCCESS, PDL_CREATED)
 * @param {string} logData.description Human-readable details
 * @param {string} [logData.affected_table] Table name
 * @param {string|number} [logData.affected_id] Record ID
 * @param {any} [logData.old_values] Object or string of prior state
 * @param {any} [logData.new_values] Object or string of new state
 * @param {number} [logData.user_id] Override user ID
 * @param {string} [logData.user_name] Override user name
 * @param {string} [logData.user_email] Override user email
 */
export async function logAudit(req, logData = {}) {
  try {
    const user = req?.session?.user || {};
    const ip = req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || req?.ip || "127.0.0.1";
    const userAgent = req?.headers?.["user-agent"] || "System / Console";

    const oldStr = logData.old_values ? (typeof logData.old_values === "string" ? logData.old_values : JSON.stringify(logData.old_values)) : null;
    const newStr = logData.new_values ? (typeof logData.new_values === "string" ? logData.new_values : JSON.stringify(logData.new_values)) : null;

    return await AuditLog.create({
      user_id: logData.user_id || user.id || null,
      user_name: logData.user_name || user.name || "System Administrator",
      user_email: logData.user_email || user.email || "admin@jms.gov.ph",
      action: logData.action || "SYSTEM_ACTION",
      description: logData.description || "Administrative activity recorded",
      ip_address: ip.replace("::ffff:", ""),
      user_agent: userAgent,
      affected_table: logData.affected_table || null,
      affected_id: logData.affected_id ? String(logData.affected_id) : null,
      old_values: oldStr,
      new_values: newStr
    });
  } catch (error) {
    console.error("❌ Failed to record audit log:", error);
    return null;
  }
}

export default logAudit;

