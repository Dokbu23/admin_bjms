/*
  Jail Management System (JMS) - XianFire Framework
  Audit Logs Controller
*/
import { Op } from "sequelize";
import { AuditLog } from "../models/auditLogModel.js";

/**
 * List Audit Logs with Multi-Field Filtering & Pagination
 */
export const listAuditLogs = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const action = req.query.action || "";
    const user = req.query.user || "";
    const startDate = req.query.start_date || "";
    const endDate = req.query.end_date || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 15;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { user_name: { [Op.like]: `%${search}%` } },
        { user_email: { [Op.like]: `%${search}%` } },
        { ip_address: { [Op.like]: `%${search}%` } },
        { action: { [Op.like]: `%${search}%` } }
      ];
    }

    if (action) {
      where.action = action;
    }

    if (user) {
      where.user_email = user;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate + " 00:00:00"), new Date(endDate + " 23:59:59")]
      };
    } else if (startDate) {
      where.createdAt = { [Op.gte]: new Date(startDate + " 00:00:00") };
    } else if (endDate) {
      where.createdAt = { [Op.lte]: new Date(endDate + " 23:59:59") };
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit) || 1;

    // Distinct actions and users for filter dropdowns
    const distinctActions = await AuditLog.findAll({
      attributes: ["action"],
      group: ["action"]
    }).then(r => r.map(i => i.action));

    const distinctUsers = await AuditLog.findAll({
      attributes: ["user_email", "user_name"],
      group: ["user_email", "user_name"],
      where: { user_email: { [Op.ne]: null } }
    });

    res.render("audit/index", {
      title: "Audit Trail & System Logs | JMS Administrator",
      logs: rows,
      totalCount: count,
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      prevPage: page - 1,
      nextPage: page + 1,
      search,
      selectedAction: action,
      selectedUser: user,
      startDate,
      endDate,
      distinctActions,
      distinctUsers
    });
  } catch (error) {
    console.error("List audit logs error:", error);
    req.flash("error_msg", "Failed to retrieve audit trail.");
    res.redirect("/dashboard");
  }
};

/**
 * Export Audit Logs to CSV, Excel, or PDF
 */
export const exportAuditLogs = async (req, res) => {
  const format = req.params.format || "csv";

  try {
    const logs = await AuditLog.findAll({
      order: [["createdAt", "DESC"]],
      limit: 1000
    });

    if (format === "csv") {
      const headers = ["Timestamp", "User Name", "User Email", "Action", "Description", "IP Address", "User Agent", "Affected Table", "Affected ID"];
      const rows = logs.map(l => [
        `"${new Date(l.createdAt).toISOString()}"`,
        `"${l.user_name || "System"}"`,
        `"${l.user_email || "N/A"}"`,
        `"${l.action}"`,
        `"${(l.description || "").replace(/"/g, '""')}"`,
        `"${l.ip_address || ""}"`,
        `"${(l.user_agent || "").replace(/"/g, '""')}"`,
        `"${l.affected_table || ""}"`,
        `"${l.affected_id || ""}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csvContent);
    }

    if (format === "excel") {
      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/></Style>
 <Style ss:ID="Row"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style>
</Styles>
<Worksheet ss:Name="Audit Trail">
<Table>
<Row ss:StyleID="Header">
<Cell><Data ss:Type="String">Timestamp</Data></Cell>
<Cell><Data ss:Type="String">User</Data></Cell>
<Cell><Data ss:Type="String">Action</Data></Cell>
<Cell><Data ss:Type="String">Description</Data></Cell>
<Cell><Data ss:Type="String">IP Address</Data></Cell>
<Cell><Data ss:Type="String">Affected Table</Data></Cell>
</Row>`;

      logs.forEach(l => {
        xml += `<Row ss:StyleID="Row">
<Cell><Data ss:Type="String">${new Date(l.createdAt).toLocaleString()}</Data></Cell>
<Cell><Data ss:Type="String">${l.user_name} (${l.user_email})</Data></Cell>
<Cell><Data ss:Type="String">${l.action}</Data></Cell>
<Cell><Data ss:Type="String">${l.description}</Data></Cell>
<Cell><Data ss:Type="String">${l.ip_address}</Data></Cell>
<Cell><Data ss:Type="String">${l.affected_table || "N/A"}</Data></Cell>
</Row>`;
      });

      xml += `</Table></Worksheet></Workbook>`;

      res.setHeader("Content-Type", "application/vnd.ms-excel");
      res.setHeader("Content-Disposition", `attachment; filename="Audit_Trail_${new Date().toISOString().slice(0, 10)}.xls"`);
      return res.send(xml);
    }

    if (format === "pdf") {
      return res.render("reports/print-template", {
        title: "Official Audit Trail Report",
        reportTitle: "OFFICIAL SECURITY AND AUDIT TRAIL LOG REPORT",
        generatedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        generatedBy: req.session.user ? req.session.user.name : "System Administrator",
        headers: ["Date & Time", "User", "Action", "Description", "IP Address", "Affected Entity"],
        rows: logs.map(l => [
          new Date(l.createdAt).toLocaleString(),
          `${l.user_name} (${l.user_email})`,
          l.action,
          l.description,
          l.ip_address,
          `${l.affected_table || "General"} #${l.affected_id || ""}`
        ]),
        layout: false
      });
    }

    res.redirect("/audit-logs");
  } catch (error) {
    console.error("Export audit logs error:", error);
    req.flash("error_msg", "Error exporting audit logs.");
    res.redirect("/audit-logs");
  }
};

export default {
  listAuditLogs,
  exportAuditLogs
};

