/*
  Jail Management System (JMS) - XianFire Framework
  Database Configuration
*/
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("myAdmin", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;
