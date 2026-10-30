/*
  Jail Management System (JMS) - XianFire Framework
  Facility & System Settings Model
*/
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const FacilitySetting = sequelize.define("FacilitySetting", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  group: {
    type: DataTypes.STRING,
    defaultValue: "general"
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "facility_settings",
  timestamps: true
});

export default FacilitySetting;

