/*
  Jail Management System (JMS) - XianFire Framework
  PDL (Persons Deprived of Liberty) Model
*/
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const PdlRecord = sequelize.define("PdlRecord", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  pdl_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  middle_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alias: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM("Male", "Female", "Other"),
    allowNull: false,
    defaultValue: "Male"
  },
  civil_status: {
    type: DataTypes.ENUM("Single", "Married", "Widowed", "Separated"),
    allowNull: false,
    defaultValue: "Single"
  },
  nationality: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Filipino"
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  emergency_contact_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergency_contact_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  case_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  court_branch: {
    type: DataTypes.STRING,
    allowNull: true
  },
  offense_charge: {
    type: DataTypes.STRING,
    allowNull: false
  },
  risk_level: {
    type: DataTypes.ENUM("Low", "Medium", "High", "Maximum"),
    allowNull: false,
    defaultValue: "Medium"
  },
  cell_block: {
    type: DataTypes.STRING,
    allowNull: false
  },
  admission_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  detention_status: {
    type: DataTypes.ENUM(
      "Detained",
      "On Trial",
      "Convicted",
      "Transferred",
      "Released",
      "Medical Facility"
    ),
    allowNull: false,
    defaultValue: "Detained"
  },
  release_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  release_reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  medical_conditions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: "pdl_records",
  timestamps: true,
  paranoid: false // soft deletes tracked via is_deleted and deleted_at
});

export default PdlRecord;

