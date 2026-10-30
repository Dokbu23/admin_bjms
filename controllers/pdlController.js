/*
  Jail Management System (JMS) - XianFire Framework
  PDL (Persons Deprived of Liberty) Records Controller
*/
import { Op } from "sequelize";
import { PdlRecord } from "../models/pdlModel.js";
import { AuditLog } from "../models/auditLogModel.js";
import { logAudit } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

const DETENTION_STATUSES = [
  "Detained",
  "On Trial",
  "Convicted",
  "Transferred",
  "Released",
  "Medical Facility"
];

const RISK_LEVELS = ["Low", "Medium", "High", "Maximum"];

/**
 * List PDL Records with Advanced Search & Multi-Filters
 */
export const listPdl = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const status = req.query.status || "";
    const risk = req.query.risk || "";
    const cellBlock = req.query.cell_block || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = { is_deleted: false };

    if (search) {
      where[Op.or] = [
        { pdl_number: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { case_number: { [Op.like]: `%${search}%` } },
        { offense_charge: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) where.detention_status = status;
    if (risk) where.risk_level = risk;
    if (cellBlock) where.cell_block = { [Op.like]: `%${cellBlock}%` };

    const { count, rows } = await PdlRecord.findAndCountAll({
      where,
      order: [["admission_date", "DESC"]],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit) || 1;

    // Distinct cell blocks for filter dropdown
    const cellBlocks = await PdlRecord.findAll({
      attributes: ["cell_block"],
      group: ["cell_block"],
      where: { is_deleted: false }
    }).then(results => results.map(r => r.cell_block));

    res.render("pdl/index", {
      title: "PDL Records Management | JMS Administrator",
      pdlList: rows,
      totalCount: count,
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      prevPage: page - 1,
      nextPage: page + 1,
      search,
      selectedStatus: status,
      selectedRisk: risk,
      selectedBlock: cellBlock,
      statuses: DETENTION_STATUSES,
      riskLevels: RISK_LEVELS,
      cellBlocks
    });
  } catch (error) {
    console.error("List PDL error:", error);
    req.flash("error_msg", "Error loading PDL records.");
    res.redirect("/dashboard");
  }
};

/**
 * Display PDL Intake Form
 */
export const createPdlPage = async (req, res) => {
  // Suggest next PDL number
  const count = await PdlRecord.count();
  const year = new Date().getFullYear();
  const suggestedPdlNumber = `PDL-${year}-${String(count + 1).padStart(4, "0")}`;

  res.render("pdl/create", {
    title: "New PDL Intake & Registration | JMS Administrator",
    suggestedPdlNumber,
    statuses: DETENTION_STATUSES,
    riskLevels: RISK_LEVELS
  });
};

/**
 * Store New PDL Record
 */
export const createPdl = async (req, res) => {
  const {
    pdl_number,
    first_name,
    middle_name,
    last_name,
    alias,
    date_of_birth,
    gender,
    civil_status,
    nationality,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    case_number,
    court_branch,
    offense_charge,
    risk_level,
    cell_block,
    admission_date,
    detention_status,
    medical_conditions,
    remarks
  } = req.body;

  if (!pdl_number || !first_name || !last_name || !case_number || !offense_charge || !cell_block || !admission_date) {
    req.flash("error_msg", "Please fill in all mandatory identification and intake fields.");
    return res.redirect("/pdl/create");
  }

  try {
    const existing = await PdlRecord.findOne({ where: { pdl_number: pdl_number.trim() } });
    if (existing) {
      req.flash("error_msg", `PDL Number ${pdl_number} is already assigned to an existing record.`);
      return res.redirect("/pdl/create");
    }

    const newRecord = await PdlRecord.create({
      pdl_number: pdl_number.trim().toUpperCase(),
      first_name: first_name.trim(),
      middle_name: middle_name ? middle_name.trim() : null,
      last_name: last_name.trim(),
      alias: alias ? alias.trim() : null,
      date_of_birth: date_of_birth || null,
      gender: gender || "Male",
      civil_status: civil_status || "Single",
      nationality: nationality ? nationality.trim() : "Filipino",
      address: address ? address.trim() : null,
      emergency_contact_name: emergency_contact_name ? emergency_contact_name.trim() : null,
      emergency_contact_phone: emergency_contact_phone ? emergency_contact_phone.trim() : null,
      case_number: case_number.trim(),
      court_branch: court_branch ? court_branch.trim() : null,
      offense_charge: offense_charge.trim(),
      risk_level: risk_level || "Medium",
      cell_block: cell_block.trim(),
      admission_date,
      detention_status: detention_status || "Detained",
      medical_conditions: medical_conditions ? medical_conditions.trim() : null,
      remarks: remarks ? remarks.trim() : null,
      created_by: req.session.user ? req.session.user.name : "System Administrator"
    });

    await logAudit(req, {
      action: "PDL_RECORD_CREATED",
      description: `Intake record created for ${pdl_number} (${first_name} ${last_name}) charged with: ${offense_charge}`,
      affected_table: "pdl_records",
      affected_id: newRecord.id,
      new_values: newRecord.toJSON()
    });

    if (risk_level === "Maximum" || risk_level === "High") {
      await createNotification({
        title: `High Risk PDL Admitted`,
        message: `${newRecord.pdl_number} (${first_name} ${last_name}) assigned to ${cell_block} under ${risk_level} security custody protocol.`,
        type: "pdl",
        link: `/pdl/${newRecord.id}`
      });
    }

    req.flash("success_msg", `PDL Record ${newRecord.pdl_number} successfully registered.`);
    return res.redirect(`/pdl/${newRecord.id}`);
  } catch (error) {
    console.error("Create PDL error:", error);
    req.flash("error_msg", "Failed to save PDL record: " + error.message);
    return res.redirect("/pdl/create");
  }
};

/**
 * View Complete PDL Profile
 */
export const viewPdl = async (req, res) => {
  const { id } = req.params;

  try {
    const pdl = await PdlRecord.findOne({
      where: { id, is_deleted: false }
    });

    if (!pdl) {
      req.flash("error_msg", "PDL record not found.");
      return res.redirect("/pdl");
    }

    const auditTrail = await AuditLog.findAll({
      where: {
        affected_table: "pdl_records",
        affected_id: String(id)
      },
      order: [["createdAt", "DESC"]]
    });

    res.render("pdl/view", {
      title: `${pdl.pdl_number} - ${pdl.first_name} ${pdl.last_name} | JMS Administrator`,
      pdl,
      auditTrail
    });
  } catch (error) {
    console.error("View PDL error:", error);
    req.flash("error_msg", "Error loading PDL profile.");
    res.redirect("/pdl");
  }
};

/**
 * Display Edit PDL Page
 */
export const editPdlPage = async (req, res) => {
  const { id } = req.params;

  try {
    const pdl = await PdlRecord.findOne({
      where: { id, is_deleted: false }
    });

    if (!pdl) {
      req.flash("error_msg", "PDL record not found.");
      return res.redirect("/pdl");
    }

    res.render("pdl/edit", {
      title: `Edit PDL ${pdl.pdl_number} | JMS Administrator`,
      pdl,
      statuses: DETENTION_STATUSES,
      riskLevels: RISK_LEVELS
    });
  } catch (error) {
    console.error("Edit PDL error:", error);
    req.flash("error_msg", "Error opening edit form.");
    res.redirect("/pdl");
  }
};

/**
 * Handle Edit PDL Submission
 */
export const updatePdl = async (req, res) => {
  const { id } = req.params;
  const {
    first_name,
    middle_name,
    last_name,
    alias,
    date_of_birth,
    gender,
    civil_status,
    nationality,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    case_number,
    court_branch,
    offense_charge,
    risk_level,
    cell_block,
    admission_date,
    detention_status,
    release_date,
    release_reason,
    medical_conditions,
    remarks
  } = req.body;

  try {
    const pdl = await PdlRecord.findOne({
      where: { id, is_deleted: false }
    });

    if (!pdl) {
      req.flash("error_msg", "PDL record not found.");
      return res.redirect("/pdl");
    }

    const oldValues = pdl.toJSON();

    pdl.first_name = first_name.trim();
    pdl.middle_name = middle_name ? middle_name.trim() : null;
    pdl.last_name = last_name.trim();
    pdl.alias = alias ? alias.trim() : null;
    pdl.date_of_birth = date_of_birth || null;
    pdl.gender = gender;
    pdl.civil_status = civil_status;
    pdl.nationality = nationality.trim();
    pdl.address = address ? address.trim() : null;
    pdl.emergency_contact_name = emergency_contact_name ? emergency_contact_name.trim() : null;
    pdl.emergency_contact_phone = emergency_contact_phone ? emergency_contact_phone.trim() : null;
    pdl.case_number = case_number.trim();
    pdl.court_branch = court_branch ? court_branch.trim() : null;
    pdl.offense_charge = offense_charge.trim();
    pdl.risk_level = risk_level;
    pdl.cell_block = cell_block.trim();
    pdl.admission_date = admission_date;
    pdl.detention_status = detention_status;
    pdl.release_date = release_date || null;
    pdl.release_reason = release_reason ? release_reason.trim() : null;
    pdl.medical_conditions = medical_conditions ? medical_conditions.trim() : null;
    pdl.remarks = remarks ? remarks.trim() : null;

    await pdl.save();

    await logAudit(req, {
      action: "PDL_RECORD_MODIFIED",
      description: `Administrative update on PDL record ${pdl.pdl_number} (${pdl.first_name} ${pdl.last_name})`,
      affected_table: "pdl_records",
      affected_id: pdl.id,
      old_values: oldValues,
      new_values: pdl.toJSON()
    });

    if (detention_status === "Released" && oldValues.detention_status !== "Released") {
      await createNotification({
        title: "PDL Release Executed",
        message: `${pdl.pdl_number} (${pdl.first_name} ${pdl.last_name}) status changed to Released. Reason: ${release_reason || "Court Order"}`,
        type: "pdl",
        link: `/pdl/${pdl.id}`
      });
    }

    req.flash("success_msg", `PDL Record ${pdl.pdl_number} updated successfully.`);
    return res.redirect(`/pdl/${pdl.id}`);
  } catch (error) {
    console.error("Update PDL error:", error);
    req.flash("error_msg", "Failed to update PDL record.");
    return res.redirect(`/pdl/${id}/edit`);
  }
};

/**
 * Handle Soft Delete of PDL Record
 */
export const deletePdl = async (req, res) => {
  const { id } = req.params;

  try {
    const pdl = await PdlRecord.findOne({
      where: { id, is_deleted: false }
    });

    if (!pdl) {
      req.flash("error_msg", "PDL record not found.");
      return res.redirect("/pdl");
    }

    pdl.is_deleted = true;
    pdl.deleted_at = new Date();
    await pdl.save();

    await logAudit(req, {
      action: "PDL_RECORD_DELETED",
      description: `Administrator archived/soft-deleted PDL record ${pdl.pdl_number} (${pdl.first_name} ${pdl.last_name})`,
      affected_table: "pdl_records",
      affected_id: pdl.id
    });

    req.flash("success_msg", `Record ${pdl.pdl_number} has been archived.`);
    return res.redirect("/pdl");
  } catch (error) {
    console.error("Delete PDL error:", error);
    req.flash("error_msg", "Failed to archive PDL record.");
    return res.redirect("/pdl");
  }
};

/**
 * Export PDL Records to CSV, Excel, or PDF View
 */
export const exportPdl = async (req, res) => {
  const format = req.params.format || "csv";

  try {
    const records = await PdlRecord.findAll({
      where: { is_deleted: false },
      order: [["admission_date", "DESC"]]
    });

    if (format === "csv") {
      const headers = ["PDL Number", "First Name", "Middle Name", "Last Name", "Gender", "Birthdate", "Case Number", "Court Branch", "Offense Charge", "Risk Level", "Cell Block", "Admission Date", "Status", "Release Date"];
      const rows = records.map(r => [
        `"${r.pdl_number}"`,
        `"${r.first_name}"`,
        `"${r.middle_name || ""}"`,
        `"${r.last_name}"`,
        `"${r.gender}"`,
        `"${r.date_of_birth || ""}"`,
        `"${r.case_number}"`,
        `"${r.court_branch || ""}"`,
        `"${r.offense_charge.replace(/"/g, '""')}"`,
        `"${r.risk_level}"`,
        `"${r.cell_block}"`,
        `"${r.admission_date}"`,
        `"${r.detention_status}"`,
        `"${r.release_date || ""}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="PDL_Master_List_${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csvContent);
    }

    if (format === "excel") {
      // Clean XML Spreadsheet format for Excel
      let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0F172A" ss:Pattern="Solid"/></Style>
 <Style ss:ID="Row"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/></Borders></Style>
</Styles>
<Worksheet ss:Name="PDL Master List">
<Table>
<Row ss:StyleID="Header">
<Cell><Data ss:Type="String">PDL Number</Data></Cell>
<Cell><Data ss:Type="String">Full Name</Data></Cell>
<Cell><Data ss:Type="String">Gender</Data></Cell>
<Cell><Data ss:Type="String">Case Number</Data></Cell>
<Cell><Data ss:Type="String">Offense Charge</Data></Cell>
<Cell><Data ss:Type="String">Risk Level</Data></Cell>
<Cell><Data ss:Type="String">Cell Block</Data></Cell>
<Cell><Data ss:Type="String">Admission Date</Data></Cell>
<Cell><Data ss:Type="String">Status</Data></Cell>
</Row>`;

      records.forEach(r => {
        xml += `<Row ss:StyleID="Row">
<Cell><Data ss:Type="String">${r.pdl_number}</Data></Cell>
<Cell><Data ss:Type="String">${r.last_name}, ${r.first_name} ${r.middle_name || ""}</Data></Cell>
<Cell><Data ss:Type="String">${r.gender}</Data></Cell>
<Cell><Data ss:Type="String">${r.case_number}</Data></Cell>
<Cell><Data ss:Type="String">${r.offense_charge}</Data></Cell>
<Cell><Data ss:Type="String">${r.risk_level}</Data></Cell>
<Cell><Data ss:Type="String">${r.cell_block}</Data></Cell>
<Cell><Data ss:Type="String">${r.admission_date}</Data></Cell>
<Cell><Data ss:Type="String">${r.detention_status}</Data></Cell>
</Row>`;
      });

      xml += `</Table></Worksheet></Workbook>`;

      res.setHeader("Content-Type", "application/vnd.ms-excel");
      res.setHeader("Content-Disposition", `attachment; filename="PDL_Master_List_${new Date().toISOString().slice(0, 10)}.xls"`);
      return res.send(xml);
    }

    if (format === "pdf") {
      // Government printable PDF layout view
      return res.render("reports/print-template", {
        title: "Official PDL Population Roster",
        reportTitle: "OFFICIAL MASTER ROSTER OF PERSONS DEPRIVED OF LIBERTY (PDL)",
        generatedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        generatedBy: req.session.user ? req.session.user.name : "System Administrator",
        headers: ["PDL Number", "Full Name", "Gender", "Case No.", "Offense / Charge", "Risk Level", "Cell Block", "Admission", "Status"],
        rows: records.map(r => [
          r.pdl_number,
          `${r.last_name}, ${r.first_name} ${r.middle_name || ""}`,
          r.gender,
          r.case_number,
          r.offense_charge,
          r.risk_level,
          r.cell_block,
          r.admission_date,
          r.detention_status
        ]),
        layout: false
      });
    }

    res.redirect("/pdl");
  } catch (error) {
    console.error("Export PDL error:", error);
    req.flash("error_msg", "Error exporting PDL records.");
    res.redirect("/pdl");
  }
};

export default {
  listPdl,
  createPdlPage,
  createPdl,
  viewPdl,
  editPdlPage,
  updatePdl,
  deletePdl,
  exportPdl
};

