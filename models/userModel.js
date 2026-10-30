/*
  Jail Management System (JMS) - XianFire Framework
  User Model (Administrator and System Accounts)
*/
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM("admin", "personnel"),
    allowNull: false,
    defaultValue: "admin"
  },
  status: {
    type: DataTypes.ENUM("active", "inactive", "locked"),
    allowNull: false,
    defaultValue: "active"
  },
  failed_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login_ip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "users",
  timestamps: true
});

export { sequelize };
export default User;
