/*
  Jail Management System (JMS) - XianFire Framework
  Audit Log Model
*/
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const AuditLog = sequelize.define("AuditLog", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  affected_table: {
    type: DataTypes.STRING,
    allowNull: true
  },
  affected_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  old_values: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  new_values: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "audit_logs",
  timestamps: true,
  updatedAt: false // audit logs are strictly append-only/read-only
});

export default AuditLog;

