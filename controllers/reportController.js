/*
  Jail Management System (JMS) - XianFire Framework
  Reports & Business Intelligence Controller
*/
import { Op } from "sequelize";
import { PdlRecord } from "../models/pdlModel.js";
import { PersonnelProfile } from "../models/personnelModel.js";
import { AuditLog } from "../models/auditLogModel.js";
import { DatabaseBackup } from "../models/backupModel.js";
import { FacilitySetting } from "../models/settingModel.js";

/**
 * Reports Hub & Selection
 */
export const reportsIndex = async (req, res) => {
  try {
    const totalPdl = await PdlRecord.count({ where: { is_deleted: false } });
    const totalPersonnel = await PersonnelProfile.count();
    const totalAuditLogs = await AuditLog.count();
    const totalBackups = await DatabaseBackup.count();

    res.render("reports/index", {
      title: "Administrative Reports & Analytics | JMS Administrator",
      counts: {
        totalPdl,
        totalPersonnel,
        totalAuditLogs,
        totalBackups
      }
    });
  } catch (error) {
    console.error("Reports index error:", error);
    res.redirect("/dashboard");
  }
};

/**
 * Generate Report View or Export
 */
export const viewReport = async (req, res) => {
  const { type } = req.params;
  const { format, start_date, end_date, search, status, category } = req.query;

  try {
    const facilityName = (await FacilitySetting.findOne({ where: { key: "facility_name" } }))?.value || "Metropolitan Regional Correctional Facility";

    let reportTitle = "Official Administrative Report";
    let headers = [];
    let rows = [];
    let summaryStats = {};

    // 1. PDL POPULATION REPORT
    if (type === "pdl-population") {
      reportTitle = "PDL POPULATION DEMOGRAPHIC & DETENTION STATUS REPORT";
      headers = ["PDL Number", "Full Name", "Gender", "Birthdate", "Risk Level", "Cell Block", "Offense Charge", "Detention Status", "Admission Date"];

      const where = { is_deleted: false };
      if (status) where.detention_status = status;
      if (search) {
        where[Op.or] = [
          { pdl_number: { [Op.like]: `%${search}%` } },
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { cell_block: { [Op.like]: `%${search}%` } }
        ];
      }

      const records = await PdlRecord.findAll({ where, order: [["cell_block", "ASC"], ["last_name", "ASC"]] });
      rows = records.map(r => [
        r.pdl_number,
        `${r.last_name}, ${r.first_name} ${r.middle_name || ""}`,
        r.gender,
        r.date_of_birth || "N/A",
        r.risk_level,
        r.cell_block,
        r.offense_charge,
        r.detention_status,
        r.admission_date
      ]);

      summaryStats = {
        totalRecords: records.length,
        detained: records.filter(r => r.detention_status === "Detained" || r.detention_status === "On Trial").length,
        convicted: records.filter(r => r.detention_status === "Convicted").length,
        medical: records.filter(r => r.detention_status === "Medical Facility").length
      };
    }

    // 2. PDL ADMISSION REPORT
    else if (type === "pdl-admission") {
      reportTitle = "PDL ADMISSIONS & COMMITMENTS INTAKE REPORT";
      headers = ["PDL Number", "Full Name", "Case Number", "Court Branch", "Offense / Charge", "Risk Level", "Cell Assignment", "Admission Date", "Intake Officer"];

      const where = { is_deleted: false };
      if (start_date && end_date) {
        where.admission_date = { [Op.between]: [start_date, end_date] };
      } else if (start_date) {
        where.admission_date = { [Op.gte]: start_date };
      }

      const records = await PdlRecord.findAll({ where, order: [["admission_date", "DESC"]] });
      rows = records.map(r => [
        r.pdl_number,
        `${r.last_name}, ${r.first_name} ${r.middle_name || ""}`,
        r.case_number,
        r.court_branch || "N/A",
        r.offense_charge,
        r.risk_level,
        r.cell_block,
        r.admission_date,
        r.created_by || "System Administrator"
      ]);

      summaryStats = {
        totalAdmissions: records.length,
        highRisk: records.filter(r => r.risk_level === "High" || r.risk_level === "Maximum").length
      };
    }

    // 3. PDL RELEASE REPORT
    else if (type === "pdl-release") {
      reportTitle = "PDL RELEASES, DISCHARGES & TRANSFERS AUDIT REPORT";
      headers = ["PDL Number", "Full Name", "Case Number", "Offense Charge", "Admission Date", "Release Date", "Release / Transfer Reason", "Final Status"];

      const where = {
        is_deleted: false,
        detention_status: { [Op.in]: ["Released", "Transferred"] }
      };

      if (start_date && end_date) {
        where.release_date = { [Op.between]: [start_date, end_date] };
      }

      const records = await PdlRecord.findAll({ where, order: [["release_date", "DESC"]] });
      rows = records.map(r => [
        r.pdl_number,
        `${r.last_name}, ${r.first_name} ${r.middle_name || ""}`,
        r.case_number,
        r.offense_charge,
        r.admission_date,
        r.release_date || "N/A",
        r.release_reason || "Court Order / Discharge Certificate",
        r.detention_status
      ]);

      summaryStats = {
        totalDischarges: records.length,
        releasedBailAcquitted: records.filter(r => r.detention_status === "Released").length,
        transferredPrisons: records.filter(r => r.detention_status === "Transferred").length
      };
    }

    // 4. PERSONNEL ACCOUNT REPORT
    else if (type === "personnel-accounts") {
      reportTitle = "PERSONNEL ACCOUNTS & OPERATIONAL DIRECTORY REPORT";
      headers = ["Badge No.", "Rank & Full Name", "Personnel Category", "Official Email", "Contact Number", "Account Status", "Date Enrolled", "Last Login"];

      const where = {};
      if (category) where.category = category;
      if (status) where.status = status;

      const records = await PersonnelProfile.findAll({ where, order: [["category", "ASC"], ["last_name", "ASC"]] });
      rows = records.map(r => [
        r.badge_number,
        `${r.rank} ${r.first_name} ${r.last_name}`,
        r.category,
        r.email,
        r.phone || "N/A",
        r.status.toUpperCase(),
        r.date_hired || r.createdAt.toISOString().slice(0, 10),
        r.last_login ? new Date(r.last_login).toLocaleDateString() : "Never"
      ]);

      summaryStats = {
        totalPersonnel: records.length,
        active: records.filter(r => r.status === "active").length,
        inactive: records.filter(r => r.status === "inactive").length,
        locked: records.filter(r => r.status === "locked").length
      };
    }

    // 5. AUDIT TRAIL REPORT
    else if (type === "audit-trail") {
      reportTitle = "SYSTEM SECURITY & ADMINISTRATIVE AUDIT TRAIL REPORT";
      headers = ["Timestamp", "User Account", "Action Code", "Activity Description", "IP Address", "Affected Entity"];

      const where = {};
      if (start_date && end_date) {
        where.createdAt = { [Op.between]: [new Date(start_date + " 00:00:00"), new Date(end_date + " 23:59:59")] };
      }

      const records = await AuditLog.findAll({ where, order: [["createdAt", "DESC"]], limit: 500 });
      rows = records.map(r => [
        new Date(r.createdAt).toLocaleString(),
        `${r.user_name} (${r.user_email || "System"})`,
        r.action,
        r.description,
        r.ip_address || "127.0.0.1",
        `${r.affected_table || "General"} #${r.affected_id || ""}`
      ]);

      summaryStats = {
        totalEvents: records.length
      };
    }

    // 6. DATABASE BACKUP REPORT
    else if (type === "database-backup") {
      reportTitle = "DATABASE DISASTER RECOVERY & ARCHIVE BACKUP REPORT";
      headers = ["Backup Filename", "Type", "File Size (KB)", "Status", "Date & Time Created", "Created By", "Restore Date"];

      const records = await DatabaseBackup.findAll({ order: [["createdAt", "DESC"]] });
      rows = records.map(r => [
        r.filename,
        r.backup_type,
        (r.file_size / 1024).toFixed(1) + " KB",
        r.status,
        new Date(r.createdAt).toLocaleString(),
        r.created_by || "System Administrator",
        r.restored_at ? new Date(r.restored_at).toLocaleString() : "Never"
      ]);

      summaryStats = {
        totalBackups: records.length,
        completed: records.filter(r => r.status === "Completed" || r.status === "Restored").length
      };
    } else {
      req.flash("error_msg", "Unknown report type specified.");
      return res.redirect("/reports");
    }

    // FORMAT EXPORTS
    if (format === "csv") {
      const csvContent = "\uFEFF" + [
        headers.map(h => `"${h}"`).join(","),
        ...rows.map(row => row.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      ].join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${type}_report_${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csvContent);
    }

    if (format === "excel") {
      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/></Style>
 <Style ss:ID="Row"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
</Styles>
<Worksheet ss:Name="Report">
<Table>
<Row ss:StyleID="Header">
${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("\n")}
</Row>`;

      rows.forEach(r => {
        xml += `<Row ss:StyleID="Row">\n${r.map(c => `<Cell><Data ss:Type="String">${String(c || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>`).join("\n")}\n</Row>\n`;
      });

      xml += `</Table></Worksheet></Workbook>`;

      res.setHeader("Content-Type", "application/vnd.ms-excel");
      res.setHeader("Content-Disposition", `attachment; filename="${type}_report_${new Date().toISOString().slice(0, 10)}.xls"`);
      return res.send(xml);
    }

    if (format === "pdf") {
      return res.render("reports/print-template", {
        title: reportTitle,
        reportTitle,
        facilityName,
        generatedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        generatedBy: req.session.user ? req.session.user.name : "System Administrator",
        headers,
        rows,
        summaryStats,
        layout: false
      });
    }

    // Default: UI Preview with Date Filters and Print options
    res.render("reports/preview", {
      title: `${reportTitle} | JMS Administrator`,
      reportType: type,
      reportTitle,
      facilityName,
      headers,
      rows,
      summaryStats,
      start_date: start_date || "",
      end_date: end_date || "",
      search: search || ""
    });
  } catch (error) {
    console.error("View report error:", error);
    req.flash("error_msg", "Error compiling report.");
    res.redirect("/reports");
  }
};

export default {
  reportsIndex,
  viewReport
};

