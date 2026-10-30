/*
  Jail Management System (JMS) - XianFire Framework
  Personnel Profile Model
*/
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import { User } from "./userModel.js";

export const PersonnelProfile = sequelize.define("PersonnelProfile", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: "id"
    }
  },
  badge_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  middle_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rank: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(
      "Booking / Records Officer",
      "Court Liaison / Legal Officer",
      "Custodial / Gate Officer",
      "Medical / Health Officer",
      "Jail Warden"
    ),
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
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergency_contact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  date_hired: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM("active", "inactive", "locked"),
    allowNull: false,
    defaultValue: "active"
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "personnel_profiles",
  timestamps: true
});

PersonnelProfile.belongsTo(User, { foreignKey: "userId", as: "userAccount" });
User.hasOne(PersonnelProfile, { foreignKey: "userId", as: "profile" });

export default PersonnelProfile;

