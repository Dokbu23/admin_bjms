/*
  Jail Management System (JMS) - XianFire Framework
  Migration Script
*/
import { Sequelize } from "sequelize";
import { sequelize } from "./models/db.js";
import "./models/index.js"; // Loads all models
import inquirer from "inquirer";

const rootSequelize = new Sequelize("mysql://root:@localhost:3306/", { logging: false });

let createDb = true;

if (process.stdin.isTTY && !process.argv.includes("--yes")) {
  const answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "createDb",
      message: "Database 'myAdmin' may not exist. Create it?",
      default: true,
    },
  ]);
  createDb = answer.createDb;
}

if (createDb) {
  await rootSequelize.query("CREATE DATABASE IF NOT EXISTS myAdmin;");
  console.log("✅ Database 'myAdmin' verified (created if not existed).");
}

try {
  await sequelize.authenticate();
  console.log("✅ Connected to MySQL database!");
  await sequelize.sync({ alter: true });
  console.log("✅ Database schema synchronized for all JMS models!");
} catch (err) {
  console.error("❌ Migration failed:", err);
} finally {
  process.exit(0);
}
