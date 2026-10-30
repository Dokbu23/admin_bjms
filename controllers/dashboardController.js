/*
  Jail Management System (JMS) - XianFire Framework
  Dashboard Controller
*/
import { Op } from "sequelize";
import { sequelize } from "../models/db.js";
import { PdlRecord } from "../models/pdlModel.js";
import { PersonnelProfile } from "../models/personnelModel.js";
import { AuditLog } from "../models/auditLogModel.js";
import { Notification } from "../models/notificationModel.js";
import { FacilitySetting } from "../models/settingModel.js";

export const dashboardPage = async (req, res) => {
  try {
    const filter = req.query.filter || "this_year";

    // Date range setup
    let dateCondition = {};
    const now = new Date();

    if (filter === "30_days") {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateCondition = { admission_date: { [Op.gte]: past30 } };
    } else if (filter === "90_days") {
      const past90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      dateCondition = { admission_date: { [Op.gte]: past90 } };
    } else if (filter === "this_year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateCondition = { admission_date: { [Op.gte]: startOfYear } };
    }

    // 1. STATISTIC CARDS (Actual MySQL Queries)
    const totalPdl = await PdlRecord.count({ where: { is_deleted: false } });
    const detainedPdl = await PdlRecord.count({
      where: {
        is_deleted: false,
        detention_status: { [Op.in]: ["Detained", "On Trial"] }
      }
    });

    // Newly registered PDL in current calendar month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newlyRegisteredPdl = await PdlRecord.count({
      where: {
        is_deleted: false,
        admission_date: { [Op.gte]: startOfCurrentMonth }
      }
    });

    const releasedPdl = await PdlRecord.count({
      where: {
        is_deleted: false,
        detention_status: "Released"
      }
    });

    const totalPersonnel = await PersonnelProfile.count();

    // Pending Administrative Actions: locked accounts + unread alerts + unassigned/review cases
    const lockedPersonnelCount = await PersonnelProfile.count({ where: { status: "locked" } });
    const unreadAlertsCount = await Notification.count({ where: { is_read: false } });
    const pendingActions = lockedPersonnelCount + unreadAlertsCount;

    // 2. CHART 1: Monthly PDL Registration (Actual SQL Group By Month)
    const [monthlyAdmissionsRaw] = await sequelize.query(`
      SELECT 
        DATE_FORMAT(admission_date, '%b %Y') as month_label,
        DATE_FORMAT(admission_date, '%Y-%m') as sort_key,
        COUNT(id) as admission_count
      FROM pdl_records
      WHERE is_deleted = 0
      GROUP BY sort_key, month_label
      ORDER BY sort_key ASC
      LIMIT 12;
    `);

    const monthlyLabels = monthlyAdmissionsRaw.map(r => r.month_label);
    const monthlyCounts = monthlyAdmissionsRaw.map(r => r.admission_count);

    // 3. CHART 2: Admission vs Release Comparison (Quarterly / Semi-Annual)
    const [admissionsVsReleasesRaw] = await sequelize.query(`
      SELECT 
        DATE_FORMAT(admission_date, '%b %Y') as period,
        COUNT(id) as admissions,
        SUM(CASE WHEN detention_status = 'Released' THEN 1 ELSE 0 END) as releases
      FROM pdl_records
      WHERE is_deleted = 0
      GROUP BY DATE_FORMAT(admission_date, '%Y-%m'), period
      ORDER BY DATE_FORMAT(admission_date, '%Y-%m') ASC
      LIMIT 6;
    `);

    const avrLabels = admissionsVsReleasesRaw.map(r => r.period);
    const avrAdmissions = admissionsVsReleasesRaw.map(r => r.admissions);
    const avrReleases = admissionsVsReleasesRaw.map(r => r.releases);

    // 4. CHART 3: PDL Population Breakdown (Detention Status)
    const [statusBreakdownRaw] = await sequelize.query(`
      SELECT detention_status, COUNT(id) as count
      FROM pdl_records
      WHERE is_deleted = 0
      GROUP BY detention_status
      ORDER BY count DESC;
    `);

    const statusLabels = statusBreakdownRaw.map(r => r.detention_status);
    const statusCounts = statusBreakdownRaw.map(r => r.count);

    // 5. CHART 4: Personnel Statistics by Category
    const [personnelCategoriesRaw] = await sequelize.query(`
      SELECT category, COUNT(id) as count
      FROM personnel_profiles
      GROUP BY category
      ORDER BY count DESC;
    `);

    const personnelLabels = personnelCategoriesRaw.map(r => r.category);
    const personnelCounts = personnelCategoriesRaw.map(r => r.count);

    // 6. Recent System Activities (Latest 8 Audit Logs)
    const recentActivities = await AuditLog.findAll({
      order: [["createdAt", "DESC"]],
      limit: 8
    });

    // 7. Recent Administrative Actions (Personnel updates, logins, backups)
    const recentAdminActions = await AuditLog.findAll({
      where: {
        action: {
          [Op.in]: [
            "PERSONNEL_CREATED",
            "PERSONNEL_MODIFIED",
            "ACCOUNT_STATUS_CHANGE",
            "ACCOUNT_LOCK_TOGGLE",
            "PDL_RECORD_CREATED",
            "PDL_RECORD_MODIFIED",
            "DATABASE_BACKUP_CREATED",
            "DATABASE_RESTORED",
            "SETTINGS_MODIFIED"
          ]
        }
      },
      order: [["createdAt", "DESC"]],
      limit: 6
    });

    // Facility overview
    const facilityNameSetting = await FacilitySetting.findOne({ where: { key: "facility_name" } });
    const facilityCodeSetting = await FacilitySetting.findOne({ where: { key: "facility_code" } });

    res.render("dashboard", {
      title: "Administrator Dashboard | Jail Management System",
      filter,
      facilityName: facilityNameSetting ? facilityNameSetting.value : "Metropolitan Regional Correctional Facility",
      facilityCode: facilityCodeSetting ? facilityCodeSetting.value : "MRCF-NCR-01",
      stats: {
        totalPdl,
        detainedPdl,
        newlyRegisteredPdl,
        releasedPdl,
        totalPersonnel,
        pendingActions,
        lockedPersonnelCount,
        unreadAlertsCount
      },
      chartData: {
        monthlyLabels: JSON.stringify(monthlyLabels),
        monthlyCounts: JSON.stringify(monthlyCounts),
        avrLabels: JSON.stringify(avrLabels),
        avrAdmissions: JSON.stringify(avrAdmissions),
        avrReleases: JSON.stringify(avrReleases),
        statusLabels: JSON.stringify(statusLabels),
        statusCounts: JSON.stringify(statusCounts),
        personnelLabels: JSON.stringify(personnelLabels),
        personnelCounts: JSON.stringify(personnelCounts)
      },
      recentActivities,
      recentAdminActions
    });
  } catch (error) {
    console.error("Dashboard controller error:", error);
    req.flash("error_msg", "Error loading dashboard metrics.");
    res.render("dashboard", {
      title: "Administrator Dashboard",
      stats: { totalPdl: 0, detainedPdl: 0, newlyRegisteredPdl: 0, releasedPdl: 0, totalPersonnel: 0, pendingActions: 0 },
      chartData: { monthlyLabels: "[]", monthlyCounts: "[]", avrLabels: "[]", avrAdmissions: "[]", avrReleases: "[]", statusLabels: "[]", statusCounts: "[]", personnelLabels: "[]", personnelCounts: "[]" },
      recentActivities: [],
      recentAdminActions: []
    });
  }
};

export default {
  dashboardPage
};

