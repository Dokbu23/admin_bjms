/*
  Jail Management System (JMS) - XianFire Framework
  Database Backup Model
*/
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const DatabaseBackup = sequelize.define("DatabaseBackup", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filepath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM("Completed", "Failed", "Restored"),
    allowNull: false,
    defaultValue: "Completed"
  },
  backup_type: {
    type: DataTypes.ENUM("Manual", "Scheduled", "System"),
    allowNull: false,
    defaultValue: "Manual"
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: true
  },
  restored_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: "database_backups",
  timestamps: true
});

export default DatabaseBackup;

