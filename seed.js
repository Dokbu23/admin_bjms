/*
  Jail Management System (JMS) - XianFire Framework
  Database Seeder & Migration Script
*/
import bcrypt from "bcrypt";
import {
  sequelize,
  User,
  PersonnelProfile,
  PdlRecord,
  FacilitySetting,
  Notification,
  AuditLog,
  DatabaseBackup
} from "./models/index.js";

async function seed() {
  console.log("🔥 Starting JMS Database Migration and Seeding...");

  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connection verified.");

    // Sync all tables with database
    await sequelize.sync({ alter: true });
    console.log("✅ Database schema synchronized.");

    // 1. Seed System Settings
    const defaultSettings = [
      { key: "facility_name", value: "Metropolitan Regional Correctional Facility", group: "facility", description: "Official name of the correctional facility" },
      { key: "facility_code", value: "MRCF-NCR-01", group: "facility", description: "Official facility identification code" },
      { key: "facility_address", value: "Camp Bagong Diwa, Bicutan, Taguig City, Metro Manila, Philippines", group: "facility", description: "Physical location address" },
      { key: "contact_number", value: "+63 (02) 8837-1234 / +63 917 555 4321", group: "facility", description: "Official telephone numbers" },
      { key: "emergency_hotline", value: "117 / (02) 8838-9999", group: "facility", description: "24/7 Security and emergency hotline" },
      { key: "official_email", value: "admin.mrcf@bjmp.gov.ph", group: "facility", description: "Official government email address" },
      { key: "warden_in_charge", value: "J/SSUPT Leonardo S. Mendoza, DSC", group: "facility", description: "Appointed Jail Warden in charge" },
      { key: "system_name", value: "JMS - Jail Management System", group: "system", description: "Application display name" },
      { key: "system_motto", value: "Securing Persons Deprived of Liberty with Human Dignity", group: "system", description: "Official portal motto" },
      { key: "timezone", value: "Asia/Manila (GMT+8)", group: "system", description: "Standard system timezone" },
      { key: "date_format", value: "YYYY-MM-DD", group: "system", description: "Standard date display format" },
      { key: "session_timeout_minutes", value: "30", group: "security", description: "Idle session timeout in minutes" },
      { key: "max_login_attempts", value: "5", group: "security", description: "Maximum failed attempts before temporary account lockout" },
      { key: "lockout_duration_minutes", value: "15", group: "security", description: "Account lockout duration in minutes" },
      { key: "min_password_length", value: "8", group: "security", description: "Minimum length for administrative passwords" },
      { key: "require_special_char", value: "true", group: "security", description: "Enforce symbols/numbers in passwords" },
      { key: "backup_reminder_days", value: "7", group: "backup", description: "Interval in days to alert for database backups" }
    ];

    for (const s of defaultSettings) {
      await FacilitySetting.findOrCreate({
        where: { key: s.key },
        defaults: s
      });
    }
    console.log("✅ Facility & System Settings configured.");

    // 2. Seed Initial System Administrator
    const adminEmail = "admin@jms.gov.ph";
    let adminUser = await User.findOne({ where: { email: adminEmail } });

    const hashedPassword = await bcrypt.hash("AdminPassword123!", 10);

    if (!adminUser) {
      adminUser = await User.create({
        name: "Captain Arthur M. Reyes",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        status: "active",
        phone: "+63 917 888 1234",
        avatar: "/images/admin-avatar.png",
        last_login_at: new Date(),
        last_login_ip: "127.0.0.1"
      });
      console.log("✅ Default System Administrator created: admin@jms.gov.ph / AdminPassword123!");
    } else {
      adminUser.password = hashedPassword;
      adminUser.role = "admin";
      adminUser.status = "active";
      await adminUser.save();
      console.log("✅ System Administrator account updated: admin@jms.gov.ph / AdminPassword123!");
    }

    // 3. Seed Personnel Profiles across all required categories
    const personnelData = [
      {
        badge_number: "P-JW-0001",
        first_name: "Leonardo",
        last_name: "Mendoza",
        middle_name: "Santos",
        rank: "Jail Senior Superintendent (J/SSUPT)",
        category: "Jail Warden",
        email: "l.mendoza@bjmp.gov.ph",
        phone: "+63 918 100 0001",
        emergency_contact: "Mrs. Carmela Mendoza (+63 918 100 0002)",
        address: "Fort Bonifacio, Taguig City",
        date_of_birth: "1974-06-15",
        date_hired: "1998-04-01",
        status: "active",
        notes: "Facility Head / Jail Warden"
      },
      {
        badge_number: "P-BK-1021",
        first_name: "Michelle",
        last_name: "Gomez",
        middle_name: "Reyes",
        rank: "Jail Inspector (J/INSP)",
        category: "Booking / Records Officer",
        email: "m.gomez@bjmp.gov.ph",
        phone: "+63 917 200 1021",
        emergency_contact: "Roberto Gomez (+63 917 200 1022)",
        address: "San Antonio Village, Makati City",
        date_of_birth: "1988-09-22",
        date_hired: "2012-08-15",
        status: "active",
        notes: "Chief of Inmate Records Section"
      },
      {
        badge_number: "P-BK-1025",
        first_name: "Sarah Jane",
        last_name: "Pascual",
        middle_name: "Diaz",
        rank: "Jail Officer 1 (JO1)",
        category: "Booking / Records Officer",
        email: "s.pascual@bjmp.gov.ph",
        phone: "+63 917 200 1025",
        emergency_contact: "Elena Pascual (+63 917 200 1026)",
        address: "Signal Village, Taguig City",
        date_of_birth: "1995-11-04",
        date_hired: "2020-02-10",
        status: "active",
        notes: "Intake Biometrics & Documentation Assistant"
      },
      {
        badge_number: "P-LG-2045",
        first_name: "Fernando",
        last_name: "Cruz",
        middle_name: "Bautista",
        rank: "Senior Jail Officer 4 (SJO4)",
        category: "Court Liaison / Legal Officer",
        email: "f.cruz@bjmp.gov.ph",
        phone: "+63 919 300 2045",
        emergency_contact: "Grace Cruz (+63 919 300 2046)",
        address: "Kapitolyo, Pasig City",
        date_of_birth: "1980-03-18",
        date_hired: "2005-06-20",
        status: "active",
        notes: "Handles RTC and MTC Subpoenas & Commitments"
      },
      {
        badge_number: "P-CG-3088",
        first_name: "Danilo",
        last_name: "Santos",
        middle_name: "Aquino",
        rank: "Senior Jail Officer 2 (SJO2)",
        category: "Custodial / Gate Officer",
        email: "d.santos@bjmp.gov.ph",
        phone: "+63 920 400 3088",
        emergency_contact: "Marites Santos (+63 920 400 3089)",
        address: "Lower Bicutan, Taguig City",
        date_of_birth: "1983-12-08",
        date_hired: "2009-01-15",
        status: "active",
        notes: "Main Security Gate & Perimeter Guard Commander"
      },
      {
        badge_number: "P-CG-3099",
        first_name: "Mark Anthony",
        last_name: "Villanueva",
        middle_name: "Castro",
        rank: "Jail Officer 2 (JO2)",
        category: "Custodial / Gate Officer",
        email: "m.villanueva@bjmp.gov.ph",
        phone: "+63 920 400 3099",
        emergency_contact: "Lorena Villanueva (+63 920 400 3100)",
        address: "Sucat, Parañaque City",
        date_of_birth: "1992-05-19",
        date_hired: "2018-09-01",
        status: "inactive",
        notes: "On authorized study leave"
      },
      {
        badge_number: "P-MD-4012",
        first_name: "Maria Elena",
        last_name: "Bautista",
        middle_name: "Navarro",
        rank: "Medical Officer III (Dr.)",
        category: "Medical / Health Officer",
        email: "e.bautista@bjmp.gov.ph",
        phone: "+63 921 500 4012",
        emergency_contact: "Dr. Raul Bautista (+63 921 500 4013)",
        address: "Alabang, Muntinlupa City",
        date_of_birth: "1982-08-30",
        date_hired: "2015-03-16",
        status: "active",
        notes: "Head Physician, Jail Health and Infirmary Unit"
      },
      {
        badge_number: "P-MD-4018",
        first_name: "Janice",
        last_name: "Morales",
        middle_name: "Perez",
        rank: "Jail Nurse (JO2)",
        category: "Medical / Health Officer",
        email: "j.morales@bjmp.gov.ph",
        phone: "+63 921 500 4018",
        emergency_contact: "Carlos Morales (+63 921 500 4019)",
        address: "Poblacion, Makati City",
        date_of_birth: "1991-04-12",
        date_hired: "2019-07-22",
        status: "locked",
        notes: "Account temporarily locked by security policy"
      }
    ];

    for (const p of personnelData) {
      await PersonnelProfile.findOrCreate({
        where: { badge_number: p.badge_number },
        defaults: p
      });
    }
    console.log(`✅ ${personnelData.length} Personnel Profiles seeded.`);

    // 4. Seed Comprehensive PDL Records
    const pdlRecordsData = [
      {
        pdl_number: "PDL-2026-0001",
        first_name: "Ramon",
        middle_name: "Castro",
        last_name: "Dizon",
        alias: "Monching",
        date_of_birth: "1980-05-12",
        gender: "Male",
        civil_status: "Married",
        nationality: "Filipino",
        address: "Zone 4, Brgy. Central, Quezon City",
        emergency_contact_name: "Teresa Dizon (Wife)",
        emergency_contact_phone: "+63 915 111 2201",
        case_number: "CR-2026-0182",
        court_branch: "RTC Branch 104, Quezon City",
        offense_charge: "Violation of Comprehensive Dangerous Drugs Act (Sec 5)",
        risk_level: "High",
        cell_block: "Block A - Cell 04",
        admission_date: "2026-01-10",
        detention_status: "Detained",
        medical_conditions: "Hypertension, under regular BP monitoring",
        remarks: "Commitment order issued Jan 10, 2026. Next hearing scheduled.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0002",
        first_name: "Eduardo",
        middle_name: "Tan",
        last_name: "Lim",
        alias: "Eddie Boy",
        date_of_birth: "1976-09-21",
        gender: "Male",
        civil_status: "Single",
        nationality: "Filipino",
        address: "Binondo, Manila",
        emergency_contact_name: "Antonio Lim (Brother)",
        emergency_contact_phone: "+63 916 222 3302",
        case_number: "CR-2026-0311",
        court_branch: "RTC Branch 42, Manila",
        offense_charge: "Qualified Theft & Falsification of Public Documents",
        risk_level: "Medium",
        cell_block: "Block B - Cell 12",
        admission_date: "2026-02-05",
        detention_status: "On Trial",
        medical_conditions: "None reported",
        remarks: "Bail petition under consideration by presiding judge.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0003",
        first_name: "Antonio",
        middle_name: "Reyes",
        last_name: "Valdez",
        alias: "Tonying",
        date_of_birth: "1985-02-14",
        gender: "Male",
        civil_status: "Married",
        nationality: "Filipino",
        address: "Brgy. San Dionisio, Parañaque City",
        emergency_contact_name: "Corazon Valdez (Mother)",
        emergency_contact_phone: "+63 917 333 4403",
        case_number: "CR-2025-9941",
        court_branch: "RTC Branch 258, Parañaque City",
        offense_charge: "Robbery with Intimidation",
        risk_level: "High",
        cell_block: "Block A - Cell 02",
        admission_date: "2025-11-18",
        detention_status: "Convicted",
        medical_conditions: "Mild asthma",
        remarks: "Awaiting final commitment order for transfer to Bureau of Corrections.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0004",
        first_name: "Manuel",
        middle_name: "Santos",
        last_name: "Salazar",
        alias: "Manny",
        date_of_birth: "1990-07-28",
        gender: "Male",
        civil_status: "Single",
        nationality: "Filipino",
        address: "Brgy. Bangkal, Makati City",
        emergency_contact_name: "Gloria Salazar (Sister)",
        emergency_contact_phone: "+63 918 444 5504",
        case_number: "CR-2026-0612",
        court_branch: "MTC Branch 61, Makati City",
        offense_charge: "Simple Estafa",
        risk_level: "Low",
        cell_block: "Block C - Dorm 1",
        admission_date: "2026-03-01",
        detention_status: "Released",
        release_date: "2026-08-15",
        release_reason: "Bail Granted via Court Release Order",
        medical_conditions: "None",
        remarks: "Discharged properly on August 15, 2026 with certificate of discharge.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0005",
        first_name: "Gabriel",
        middle_name: "Villanueva",
        last_name: "Mercado",
        alias: "Gabby",
        date_of_birth: "1993-10-05",
        gender: "Male",
        civil_status: "Single",
        nationality: "Filipino",
        address: "Ususan, Taguig City",
        emergency_contact_name: "Rodrigo Mercado (Father)",
        emergency_contact_phone: "+63 919 555 6605",
        case_number: "CR-2026-0790",
        court_branch: "RTC Branch 266, Taguig City",
        offense_charge: "Illegal Possession of Firearms and Ammunition (RA 10591)",
        risk_level: "High",
        cell_block: "Block A - Cell 08",
        admission_date: "2026-03-20",
        detention_status: "Detained",
        medical_conditions: "Type 2 Diabetes mellitus",
        remarks: "High security custody protocol active.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0006",
        first_name: "Christopher",
        middle_name: "Bautista",
        last_name: "Aquino",
        alias: "Topher",
        date_of_birth: "1988-04-18",
        gender: "Male",
        civil_status: "Married",
        nationality: "Filipino",
        address: "Commonwealth, Quezon City",
        emergency_contact_name: "Luzviminda Aquino (Wife)",
        emergency_contact_phone: "+63 920 666 7706",
        case_number: "CR-2026-0922",
        court_branch: "RTC Branch 88, Quezon City",
        offense_charge: "Homicide",
        risk_level: "Maximum",
        cell_block: "Max Security Wing - Cell 01",
        admission_date: "2026-04-14",
        detention_status: "On Trial",
        medical_conditions: "None",
        remarks: "Strict segregation advised due to high case sensitivity.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0007",
        first_name: "Jennifer",
        middle_name: "Lopez",
        last_name: "Enriquez",
        alias: "Jenny",
        date_of_birth: "1994-12-03",
        gender: "Female",
        civil_status: "Single",
        nationality: "Filipino",
        address: "Brgy. Moonwalk, Parañaque City",
        emergency_contact_name: "Maricar Enriquez (Mother)",
        emergency_contact_phone: "+63 921 777 8807",
        case_number: "CR-2026-1044",
        court_branch: "RTC Branch 195, Parañaque City",
        offense_charge: "Large-Scale Illegal Recruitment",
        risk_level: "Medium",
        cell_block: "Female Dormitory - Cell 03",
        admission_date: "2026-05-02",
        detention_status: "Detained",
        medical_conditions: "Allergic rhinitis",
        remarks: "Female dormitory intake complete.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0008",
        first_name: "Rodrigo",
        middle_name: "Flores",
        last_name: "Pineda",
        alias: "Roding",
        date_of_birth: "1972-01-19",
        gender: "Male",
        civil_status: "Married",
        nationality: "Filipino",
        address: "Pateros, Metro Manila",
        emergency_contact_name: "Alicia Pineda (Wife)",
        emergency_contact_phone: "+63 922 888 9908",
        case_number: "CR-2026-1188",
        court_branch: "RTC Branch 153, Pasig City",
        offense_charge: "Graft and Corrupt Practices (RA 3019)",
        risk_level: "Low",
        cell_block: "Block C - Dorm 2",
        admission_date: "2026-05-28",
        detention_status: "On Trial",
        medical_conditions: "Coronary artery disease, requires cardiac maintenance medication",
        remarks: "Monitored closely by jail medical officer.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0009",
        first_name: "Danilo",
        middle_name: "Geronimo",
        last_name: "Soriano",
        alias: "Danny",
        date_of_birth: "1983-08-11",
        gender: "Male",
        civil_status: "Separated",
        nationality: "Filipino",
        address: "Barangka, Marikina City",
        emergency_contact_name: "Josephine Soriano (Sister)",
        emergency_contact_phone: "+63 923 999 0009",
        case_number: "CR-2026-1305",
        court_branch: "RTC Branch 272, Marikina City",
        offense_charge: "Carnapping (RA 10883)",
        risk_level: "High",
        cell_block: "Block A - Cell 10",
        admission_date: "2026-06-12",
        detention_status: "Detained",
        medical_conditions: "None",
        remarks: "Co-accused with PDL-2026-0010.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0010",
        first_name: "Federico",
        middle_name: "Navarro",
        last_name: "Castillo",
        alias: "Freddie",
        date_of_birth: "1986-03-25",
        gender: "Male",
        civil_status: "Single",
        nationality: "Filipino",
        address: "Concepcion Uno, Marikina City",
        emergency_contact_name: "Arlene Castillo (Mother)",
        emergency_contact_phone: "+63 924 000 1110",
        case_number: "CR-2026-1306",
        court_branch: "RTC Branch 272, Marikina City",
        offense_charge: "Carnapping (RA 10883)",
        risk_level: "High",
        cell_block: "Block A - Cell 11",
        admission_date: "2026-06-12",
        detention_status: "Detained",
        medical_conditions: "None",
        remarks: "Co-accused with PDL-2026-0009.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0011",
        first_name: "Oscar",
        middle_name: "Morales",
        last_name: "Cordero",
        alias: "Oca",
        date_of_birth: "1979-11-30",
        gender: "Male",
        civil_status: "Married",
        nationality: "Filipino",
        address: "Tondo, Manila",
        emergency_contact_name: "Remedios Cordero (Wife)",
        emergency_contact_phone: "+63 925 111 2211",
        case_number: "CR-2026-1490",
        court_branch: "RTC Branch 18, Manila",
        offense_charge: "Frustrated Murder",
        risk_level: "Maximum",
        cell_block: "Max Security Wing - Cell 04",
        admission_date: "2026-07-08",
        detention_status: "Detained",
        medical_conditions: "Chronic lower back pain",
        remarks: "Maximum security watch list.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0012",
        first_name: "Vicente",
        middle_name: "Pascual",
        last_name: "Alcantara",
        alias: "Enteng",
        date_of_birth: "1968-06-09",
        gender: "Male",
        civil_status: "Widowed",
        nationality: "Filipino",
        address: "Poblacion, Muntinlupa City",
        emergency_contact_name: "Giselle Alcantara (Daughter)",
        emergency_contact_phone: "+63 926 222 3312",
        case_number: "CR-2026-1601",
        court_branch: "RTC Branch 203, Muntinlupa City",
        offense_charge: "Arson with Homicide",
        risk_level: "High",
        cell_block: "Medical Infirmary - Bed 02",
        admission_date: "2026-07-29",
        detention_status: "Medical Facility",
        medical_conditions: "Severe COPD and post-stroke rehabilitation",
        remarks: "Admitted directly into Jail Infirmary Unit for continuous medical supervision.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0013",
        first_name: "Jasmine",
        middle_name: "Cruz",
        last_name: "Tolentino",
        alias: "Jas",
        date_of_birth: "1996-02-18",
        gender: "Female",
        civil_status: "Single",
        nationality: "Filipino",
        address: "Bicutan, Taguig City",
        emergency_contact_name: "Rowena Tolentino (Sister)",
        emergency_contact_phone: "+63 927 333 4413",
        case_number: "CR-2026-1755",
        court_branch: "MTC Branch 115, Taguig City",
        offense_charge: "Cybercrime Act - Online Libel & Extortion",
        risk_level: "Low",
        cell_block: "Female Dormitory - Cell 01",
        admission_date: "2026-08-10",
        detention_status: "Released",
        release_date: "2026-09-30",
        release_reason: "Case Dismissed / Compromise Agreement Approved",
        medical_conditions: "None",
        remarks: "Released in accordance with Court Order dated Sept 30, 2026.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0014",
        first_name: "Ernesto",
        middle_name: "Del Rosario",
        last_name: "Gutierrez",
        alias: "Erning",
        date_of_birth: "1982-12-14",
        gender: "Male",
        civil_status: "Married",
        nationality: "Filipino",
        address: "San Andres Bukid, Manila",
        emergency_contact_name: "Vilma Gutierrez (Wife)",
        emergency_contact_phone: "+63 928 444 5514",
        case_number: "CR-2026-1902",
        court_branch: "RTC Branch 12, Manila",
        offense_charge: "Illegal Possession of Explosives",
        risk_level: "Maximum",
        cell_block: "Max Security Wing - Cell 06",
        admission_date: "2026-09-05",
        detention_status: "Detained",
        medical_conditions: "Gastric ulcer",
        remarks: "Escort security priority on all court transport dates.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0015",
        first_name: "Reynaldo",
        middle_name: "Mendoza",
        last_name: "Bernardo",
        alias: "Rey",
        date_of_birth: "1987-10-27",
        gender: "Male",
        civil_status: "Single",
        nationality: "Filipino",
        address: "Bagong Silang, Caloocan City",
        emergency_contact_name: "Danilo Bernardo (Father)",
        emergency_contact_phone: "+63 929 555 6615",
        case_number: "CR-2026-2015",
        court_branch: "RTC Branch 122, Caloocan City",
        offense_charge: "Robbery with Homicide",
        risk_level: "Maximum",
        cell_block: "Max Security Wing - Cell 02",
        admission_date: "2026-10-02",
        detention_status: "Transferred",
        release_date: "2026-10-20",
        release_reason: "Transferred to New Bilibid Prison per Supreme Court Order",
        medical_conditions: "None",
        remarks: "Safely transferred under high-risk convoy security.",
        created_by: "System Administrator"
      },
      {
        pdl_number: "PDL-2026-0016",
        first_name: "Rolando",
        middle_name: "Diaz",
        last_name: "Macaraig",
        alias: "Lando",
        date_of_birth: "1991-05-08",
        gender: "Male",
        civil_status: "Single",
        nationality: "Filipino",
        address: "Pinagsama, Taguig City",
        emergency_contact_name: "Lucia Macaraig (Mother)",
        emergency_contact_phone: "+63 930 666 7716",
        case_number: "CR-2026-2140",
        court_branch: "RTC Branch 70, Pasig City",
        offense_charge: "Illegal Recruitment & Estafa",
        risk_level: "Medium",
        cell_block: "Block B - Cell 05",
        admission_date: "2026-10-18",
        detention_status: "Detained",
        medical_conditions: "None",
        remarks: "Newly admitted PDL. Quarantine protocol observed.",
        created_by: "System Administrator"
      }
    ];

    for (const pdl of pdlRecordsData) {
      await PdlRecord.findOrCreate({
        where: { pdl_number: pdl.pdl_number },
        defaults: pdl
      });
    }
    console.log(`✅ ${pdlRecordsData.length} PDL records seeded.`);

    // 5. Seed Initial Notifications
    const initialNotifications = [
      {
        title: "Scheduled Database Backup Reminder",
        message: "It has been over 7 days since the last scheduled full database backup was generated. Please perform a manual backup.",
        type: "backup",
        link: "/backups"
      },
      {
        title: "Suspicious Login Attempt Detected",
        message: "An unauthorized attempt to sign in with incorrect credentials was logged from IP 192.168.1.145.",
        type: "security",
        link: "/audit-logs"
      },
      {
        title: "New Personnel Account Added",
        message: "Personnel account for J/INSP Michelle Gomez (Booking / Records Officer) was created by System Administrator.",
        type: "personnel",
        link: "/personnel"
      },
      {
        title: "PDL Medical Transfer Alert",
        message: "PDL-2026-0012 (Vicente Alcantara) was admitted to Jail Infirmary for medical monitoring.",
        type: "pdl",
        link: "/pdl"
      },
      {
        title: "System Maintenance Completed",
        message: "Routine database index maintenance and security policy checks completed successfully.",
        type: "system",
        link: "/settings"
      }
    ];

    for (const n of initialNotifications) {
      await Notification.findOrCreate({
        where: { title: n.title },
        defaults: n
      });
    }
    console.log(`✅ ${initialNotifications.length} Notifications seeded.`);

    // 6. Seed Initial Audit Logs
    const initialAuditLogs = [
      {
        user_name: "System Administrator",
        user_email: "admin@jms.gov.ph",
        action: "SYSTEM_INITIALIZE",
        description: "JMS System Administrator module initialized and verified on XianFire Framework",
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        affected_table: "facility_settings",
        affected_id: "1"
      },
      {
        user_name: "System Administrator",
        user_email: "admin@jms.gov.ph",
        action: "ADMIN_LOGIN_SUCCESS",
        description: "Administrator successfully logged in via administrative portal",
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        affected_table: "users",
        affected_id: "1"
      },
      {
        user_name: "System Administrator",
        user_email: "admin@jms.gov.ph",
        action: "PDL_RECORD_CREATED",
        description: "Created administrative PDL record for PDL-2026-0016 (Rolando Macaraig)",
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        affected_table: "pdl_records",
        affected_id: "16"
      },
      {
        user_name: "System Administrator",
        user_email: "admin@jms.gov.ph",
        action: "SETTINGS_MODIFIED",
        description: "Updated facility operational settings and emergency hotlines",
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        affected_table: "facility_settings",
        affected_id: "all"
      }
    ];

    for (const a of initialAuditLogs) {
      await AuditLog.create(a);
    }
    console.log(`✅ ${initialAuditLogs.length} Audit logs recorded.`);

    // 7. Seed Initial Baseline Database Backup record
    await DatabaseBackup.findOrCreate({
      where: { filename: "jms_baseline_initial_backup.sql" },
      defaults: {
        filename: "jms_baseline_initial_backup.sql",
        filepath: "storage/backups/jms_baseline_initial_backup.sql",
        file_size: 245760,
        status: "Completed",
        backup_type: "System",
        notes: "Initial system deployment baseline database snapshot",
        created_by: "System Administrator"
      }
    });
    console.log("✅ Initial baseline backup record established.");

    console.log("🎉 JMS Database Seeding Completed Successfully!");
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();

