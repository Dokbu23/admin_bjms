/*
  Jail Management System (JMS) - XianFire Framework
  Database Backup and Restore Service
*/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import { sequelize } from "../models/db.js";
import { DatabaseBackup } from "../models/backupModel.js";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory outside the publicly accessible 'public/' folder
const BACKUP_DIR = path.join(__dirname, "../storage/backups");

// Ensure backup folder exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Generate a database backup file and database record.
 */
export async function createBackup({ type = "Manual", notes = "", createdBy = "System Administrator" } = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `jms_backup_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    let success = false;

    // First attempt: mysqldump CLI
    try {
      const cmd = `mysqldump --user=root --host=localhost --add-drop-table --routines --triggers myAdmin > "${filepath}"`;
      await execAsync(cmd, { shell: "cmd.exe" });
      if (fs.existsSync(filepath) && fs.statSync(filepath).size > 100) {
        success = true;
      }
    } catch (cliErr) {
      console.warn("⚠️ mysqldump CLI failed or not in PATH, using Sequelize exporter fallback...", cliErr.message);
    }

    // Fallback: Pure Sequelize SQL Exporter
    if (!success) {
      let sqlDump = `-- JMS Database Backup Export\n-- Date: ${new Date().toISOString()}\n-- Database: myAdmin\n\n`;
      sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

      const [tables] = await sequelize.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
      const dbKey = Object.keys(tables[0] || {})[0];

      for (const tRow of tables) {
        const tbl = tRow[dbKey];
        const [[createResult]] = await sequelize.query(`SHOW CREATE TABLE \`${tbl}\``);
        sqlDump += `DROP TABLE IF EXISTS \`${tbl}\`;\n`;
        sqlDump += `${createResult["Create Table"]};\n\n`;

        const [rows] = await sequelize.query(`SELECT * FROM \`${tbl}\``);
        if (rows.length > 0) {
          const keys = Object.keys(rows[0]);
          const colList = keys.map(k => `\`${k}\``).join(", ");
          sqlDump += `INSERT INTO \`${tbl}\` (${colList}) VALUES\n`;

          const valStrings = rows.map(r => {
            const vals = keys.map(k => {
              const v = r[k];
              if (v === null || v === undefined) return "NULL";
              if (typeof v === "number" || typeof v === "boolean") return v;
              if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
              return `'${String(v).replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, char => {
                switch (char) {
                  case "\0": return "\\0";
                  case "\x08": return "\\b";
                  case "\x09": return "\\t";
                  case "\x1a": return "\\z";
                  case "\n": return "\\n";
                  case "\r": return "\\r";
                  case "\"":
                  case "'":
                  case "\\":
                  case "%": return "\\" + char;
                  default: return char;
                }
              })}'`;
            });
            return `(${vals.join(", ")})`;
          });

          sqlDump += valStrings.join(",\n") + ";\n\n";
        }
      }

      sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
      fs.writeFileSync(filepath, sqlDump, "utf8");
      success = true;
    }

    const stats = fs.statSync(filepath);

    const backupRecord = await DatabaseBackup.create({
      filename,
      filepath,
      file_size: stats.size,
      status: "Completed",
      backup_type: type,
      notes: notes || `Database backup created via System Administrator portal`,
      created_by: createdBy
    });

    return { success: true, backup: backupRecord };
  } catch (error) {
    console.error("❌ Backup failed:", error);
    try {
      await DatabaseBackup.create({
        filename,
        filepath,
        file_size: 0,
        status: "Failed",
        backup_type: type,
        notes: `Error: ${error.message}`,
        created_by: createdBy
      });
    } catch (_) {}
    throw error;
  }
}

/**
 * Validate and restore a database from backup file.
 */
export async function restoreBackup(backupId) {
  const backup = await DatabaseBackup.findByPk(backupId);
  if (!backup) throw new Error("Backup record not found.");

  if (!fs.existsSync(backup.filepath)) {
    throw new Error("Physical backup file does not exist on server storage.");
  }

  // Validate SQL file content
  const content = fs.readFileSync(backup.filepath, "utf8");
  if (!content || (!content.includes("CREATE TABLE") && !content.includes("INSERT INTO"))) {
    throw new Error("Backup file validation failed: invalid SQL file content.");
  }

  let restored = false;

  // Try mysql CLI restore
  try {
    const cmd = `mysql --user=root --host=localhost myAdmin < "${backup.filepath}"`;
    await execAsync(cmd, { shell: "cmd.exe" });
    restored = true;
  } catch (cliErr) {
    console.warn("⚠️ mysql CLI restore failed, using query runner fallback...", cliErr.message);
  }

  // Fallback: Split and run statements safely
  if (!restored) {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");
    const statements = content
      .split(/;\s*[\r\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await sequelize.query(stmt);
      } catch (e) {
        console.warn("Statement execution notice:", e.message);
      }
    }
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");
  }

  // Update backup record
  backup.status = "Restored";
  backup.restored_at = new Date();
  await backup.save();

  return backup;
}

export { BACKUP_DIR };
export default {
  createBackup,
  restoreBackup,
  BACKUP_DIR
};

