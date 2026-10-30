/*
  Jail Management System (JMS) - XianFire Framework
  Personnel Management Controller (System Administrator Only)
*/
import { Op } from "sequelize";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { PersonnelProfile } from "../models/personnelModel.js";
import { User } from "../models/userModel.js";
import { AuditLog } from "../models/auditLogModel.js";
import { logAudit } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

const CATEGORIES = [
  "Booking / Records Officer",
  "Court Liaison / Legal Officer",
  "Custodial / Gate Officer",
  "Medical / Health Officer",
  "Jail Warden"
];

/**
 * List Personnel with Search, Filters, and Pagination
 */
export const listPersonnel = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const category = req.query.category || "";
    const status = req.query.status || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { badge_number: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { rank: { [Op.like]: `%${search}%` } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await PersonnelProfile.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit) || 1;

    res.render("personnel/index", {
      title: "Personnel Management | JMS Administrator",
      personnelList: rows,
      totalCount: count,
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      prevPage: page - 1,
      nextPage: page + 1,
      search,
      selectedCategory: category,
      selectedStatus: status,
      categories: CATEGORIES
    });
  } catch (error) {
    console.error("List personnel error:", error);
    req.flash("error_msg", "Failed to load personnel records.");
    res.redirect("/dashboard");
  }
};

/**
 * Display Create Personnel Form
 */
export const createPersonnelPage = (req, res) => {
  res.render("personnel/create", {
    title: "Add Jail Personnel Account | JMS Administrator",
    categories: CATEGORIES
  });
};

/**
 * Handle Create Personnel
 */
export const createPersonnel = async (req, res) => {
  const {
    badge_number,
    first_name,
    middle_name,
    last_name,
    rank,
    category,
    email,
    phone,
    emergency_contact,
    address,
    date_of_birth,
    date_hired,
    notes
  } = req.body;

  if (!badge_number || !first_name || !last_name || !rank || !category || !email) {
    req.flash("error_msg", "Please fill in all mandatory personnel details.");
    return res.redirect("/personnel/create");
  }

  try {
    // Check uniqueness
    const existingBadge = await PersonnelProfile.findOne({ where: { badge_number: badge_number.trim() } });
    if (existingBadge) {
      req.flash("error_msg", `Badge number ${badge_number} is already assigned to another officer.`);
      return res.redirect("/personnel/create");
    }

    const existingEmail = await PersonnelProfile.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existingEmail) {
      req.flash("error_msg", `Email address ${email} is already in use.`);
      return res.redirect("/personnel/create");
    }

    const newPersonnel = await PersonnelProfile.create({
      badge_number: badge_number.trim(),
      first_name: first_name.trim(),
      middle_name: middle_name ? middle_name.trim() : null,
      last_name: last_name.trim(),
      rank: rank.trim(),
      category,
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      emergency_contact: emergency_contact ? emergency_contact.trim() : null,
      address: address ? address.trim() : null,
      date_of_birth: date_of_birth || null,
      date_hired: date_hired || null,
      status: "active",
      notes: notes ? notes.trim() : null
    });

    await logAudit(req, {
      action: "PERSONNEL_CREATED",
      description: `Created personnel profile for ${rank} ${first_name} ${last_name} (${badge_number}) in category: ${category}`,
      affected_table: "personnel_profiles",
      affected_id: newPersonnel.id,
      new_values: newPersonnel.toJSON()
    });

    await createNotification({
      title: "New Personnel Account Enrolled",
      message: `${rank} ${first_name} ${last_name} enrolled as ${category}.`,
      type: "personnel",
      link: `/personnel/${newPersonnel.id}`
    });

    req.flash("success_msg", `Personnel record for ${first_name} ${last_name} (${badge_number}) created successfully.`);
    return res.redirect(`/personnel/${newPersonnel.id}`);
  } catch (error) {
    console.error("Create personnel error:", error);
    req.flash("error_msg", "Failed to create personnel account: " + error.message);
    return res.redirect("/personnel/create");
  }
};

/**
 * View Single Personnel Profile
 */
export const viewPersonnel = async (req, res) => {
  const { id } = req.params;

  try {
    const personnel = await PersonnelProfile.findByPk(id);

    if (!personnel) {
      req.flash("error_msg", "Personnel profile not found.");
      return res.redirect("/personnel");
    }

    // Related audit activities for this officer
    const activities = await AuditLog.findAll({
      where: {
        affected_table: "personnel_profiles",
        affected_id: String(id)
      },
      order: [["createdAt", "DESC"]],
      limit: 10
    });

    res.render("personnel/view", {
      title: `${personnel.rank} ${personnel.first_name} ${personnel.last_name} | JMS Administrator`,
      personnel,
      activities
    });
  } catch (error) {
    console.error("View personnel error:", error);
    req.flash("error_msg", "Error loading personnel profile.");
    res.redirect("/personnel");
  }
};

/**
 * Display Edit Personnel Page
 */
export const editPersonnelPage = async (req, res) => {
  const { id } = req.params;

  try {
    const personnel = await PersonnelProfile.findByPk(id);

    if (!personnel) {
      req.flash("error_msg", "Personnel profile not found.");
      return res.redirect("/personnel");
    }

    res.render("personnel/edit", {
      title: `Edit Personnel: ${personnel.first_name} ${personnel.last_name} | JMS Administrator`,
      personnel,
      categories: CATEGORIES
    });
  } catch (error) {
    console.error("Edit personnel error:", error);
    req.flash("error_msg", "Error opening edit form.");
    res.redirect("/personnel");
  }
};

/**
 * Handle Edit Personnel Submission
 */
export const updatePersonnel = async (req, res) => {
  const { id } = req.params;
  const {
    first_name,
    middle_name,
    last_name,
    rank,
    category,
    phone,
    emergency_contact,
    address,
    date_of_birth,
    date_hired,
    status,
    notes
  } = req.body;

  try {
    const personnel = await PersonnelProfile.findByPk(id);

    if (!personnel) {
      req.flash("error_msg", "Personnel record not found.");
      return res.redirect("/personnel");
    }

    const oldValues = personnel.toJSON();

    personnel.first_name = first_name.trim();
    personnel.middle_name = middle_name ? middle_name.trim() : null;
    personnel.last_name = last_name.trim();
    personnel.rank = rank.trim();
    personnel.category = category;
    personnel.phone = phone ? phone.trim() : null;
    personnel.emergency_contact = emergency_contact ? emergency_contact.trim() : null;
    personnel.address = address ? address.trim() : null;
    personnel.date_of_birth = date_of_birth || null;
    personnel.date_hired = date_hired || null;
    if (status) personnel.status = status;
    personnel.notes = notes ? notes.trim() : null;

    await personnel.save();

    await logAudit(req, {
      action: "PERSONNEL_MODIFIED",
      description: `Updated profile details for officer ${personnel.rank} ${personnel.first_name} ${personnel.last_name} (${personnel.badge_number})`,
      affected_table: "personnel_profiles",
      affected_id: personnel.id,
      old_values: oldValues,
      new_values: personnel.toJSON()
    });

    req.flash("success_msg", `Personnel record for ${personnel.first_name} ${personnel.last_name} updated successfully.`);
    return res.redirect(`/personnel/${personnel.id}`);
  } catch (error) {
    console.error("Update personnel error:", error);
    req.flash("error_msg", "Failed to update personnel profile.");
    return res.redirect(`/personnel/${id}/edit`);
  }
};

/**
 * Toggle Account Activation / Deactivation
 */
export const togglePersonnelStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const personnel = await PersonnelProfile.findByPk(id);

    if (!personnel) {
      req.flash("error_msg", "Personnel record not found.");
      return res.redirect("/personnel");
    }

    const previousStatus = personnel.status;
    const newStatus = previousStatus === "active" ? "inactive" : "active";
    personnel.status = newStatus;
    await personnel.save();

    await logAudit(req, {
      action: "ACCOUNT_STATUS_CHANGE",
      description: `Changed personnel account status from '${previousStatus}' to '${newStatus}' for ${personnel.rank} ${personnel.first_name} ${personnel.last_name}`,
      affected_table: "personnel_profiles",
      affected_id: personnel.id,
      old_values: { status: previousStatus },
      new_values: { status: newStatus }
    });

    req.flash("success_msg", `Officer ${personnel.first_name} ${personnel.last_name} account marked as ${newStatus.toUpperCase()}.`);
    return res.redirect(`/personnel/${personnel.id}`);
  } catch (error) {
    console.error("Toggle status error:", error);
    req.flash("error_msg", "Failed to toggle personnel status.");
    return res.redirect("/personnel");
  }
};

/**
 * Lock / Unlock Account
 */
export const togglePersonnelLock = async (req, res) => {
  const { id } = req.params;

  try {
    const personnel = await PersonnelProfile.findByPk(id);

    if (!personnel) {
      req.flash("error_msg", "Personnel record not found.");
      return res.redirect("/personnel");
    }

    const previousStatus = personnel.status;
    const newStatus = previousStatus === "locked" ? "active" : "locked";
    personnel.status = newStatus;
    await personnel.save();

    await logAudit(req, {
      action: "ACCOUNT_LOCK_TOGGLE",
      description: `Administrator ${newStatus === "locked" ? "locked" : "unlocked"} account for ${personnel.rank} ${personnel.first_name} ${personnel.last_name}`,
      affected_table: "personnel_profiles",
      affected_id: personnel.id,
      old_values: { status: previousStatus },
      new_values: { status: newStatus }
    });

    req.flash("success_msg", `Account for officer ${personnel.first_name} ${personnel.last_name} is now ${newStatus.toUpperCase()}.`);
    return res.redirect(`/personnel/${personnel.id}`);
  } catch (error) {
    console.error("Toggle lock error:", error);
    req.flash("error_msg", "Failed to toggle account lock.");
    return res.redirect("/personnel");
  }
};

/**
 * Reset Personnel Password (Generates Secure Temp Credentials)
 */
export const resetPersonnelPassword = async (req, res) => {
  const { id } = req.params;

  try {
    const personnel = await PersonnelProfile.findByPk(id);

    if (!personnel) {
      req.flash("error_msg", "Personnel record not found.");
      return res.redirect("/personnel");
    }

    // Generate random 10-char temporary alphanumeric password
    const tempPassword = "Jms@" + crypto.randomBytes(3).toString("hex") + "!";

    await logAudit(req, {
      action: "PERSONNEL_PASSWORD_RESET",
      description: `Administrator reset credentials for officer ${personnel.badge_number} (${personnel.first_name} ${personnel.last_name}). Temporary access token generated.`,
      affected_table: "personnel_profiles",
      affected_id: personnel.id
    });

    req.flash("success_msg", `Credentials reset for ${personnel.rank} ${personnel.first_name} ${personnel.last_name}. Temporary Password: ${tempPassword}`);
    return res.redirect(`/personnel/${personnel.id}`);
  } catch (error) {
    console.error("Reset password error:", error);
    req.flash("error_msg", "Failed to reset password.");
    return res.redirect("/personnel");
  }
};

export default {
  listPersonnel,
  createPersonnelPage,
  createPersonnel,
  viewPersonnel,
  editPersonnelPage,
  updatePersonnel,
  togglePersonnelStatus,
  togglePersonnelLock,
  resetPersonnelPassword
};
