/*
  Jail Management System (JMS) - XianFire Framework
  Notification Model
*/
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM("security", "system", "pdl", "personnel", "backup"),
    allowNull: false,
    defaultValue: "system"
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "notifications",
  timestamps: true
});

export default Notification;

