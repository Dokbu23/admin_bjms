/*
  Jail Management System (JMS) - XianFire Framework
  Password Reset Token Model
*/
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const PasswordResetToken = sequelize.define("PasswordResetToken", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: "password_reset_tokens",
  timestamps: true
});

export default PasswordResetToken;

