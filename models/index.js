/*
  Jail Management System (JMS) - XianFire Framework
  Central Model Exports
*/
import { sequelize } from "./db.js";
import { User } from "./userModel.js";
import { PersonnelProfile } from "./personnelModel.js";
import { PdlRecord } from "./pdlModel.js";
import { FacilitySetting } from "./settingModel.js";
import { Notification } from "./notificationModel.js";
import { AuditLog } from "./auditLogModel.js";
import { DatabaseBackup } from "./backupModel.js";
import { PasswordResetToken } from "./passwordResetModel.js";

export {
  sequelize,
  User,
  PersonnelProfile,
  PdlRecord,
  FacilitySetting,
  Notification,
  AuditLog,
  DatabaseBackup,
  PasswordResetToken
};

export default {
  sequelize,
  User,
  PersonnelProfile,
  PdlRecord,
  FacilitySetting,
  Notification,
  AuditLog,
  DatabaseBackup,
  PasswordResetToken
};

