/*
  Jail Management System (JMS) - Comprehensive Verification Suite
  Runs end-to-end integration tests on all modules
*/
import app from "./index.js";
import http from "http";
import assert from "assert";

let server;
const PORT = 3055;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let sessionCookie = "";

// Helper for making requests with cookie persistence
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  if (sessionCookie) {
    headers["Cookie"] = sessionCookie;
  }

  const fetchOptions = {
    method: options.method || "GET",
    headers,
    redirect: "manual"
  };

  if (options.body) {
    if (typeof options.body === "object" && !(options.body instanceof URLSearchParams)) {
      fetchOptions.headers["Content-Type"] = "application/x-www-form-urlencoded";
      fetchOptions.body = new URLSearchParams(options.body).toString();
    } else {
      fetchOptions.body = options.body;
    }
  }

  const res = await fetch(url, fetchOptions);

  // Capture session cookie if set
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    sessionCookie = setCookie.split(";")[0];
  }

  const text = await res.text();
  return { status: res.status, headers: res.headers, text };
}

async function runTests() {
  console.log("🚀 Launching JMS Test Server on port " + PORT + "...");

  server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log("✅ Test server listening.");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`⏳ Testing: ${name}... `);
      await fn();
      console.log("✅ PASS");
      passed++;
    } catch (err) {
      console.log("❌ FAIL:", err.message);
      failed++;
    }
  }

  try {
    // 1. Unauthenticated Route Protection
    await test("Protected Route Guard (/dashboard -> redirect /login)", async () => {
      const res = await request("/dashboard");
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.get("location").includes("/login"));
    });

    // 2. Login Page Renders
    await test("Login Page (/login)", async () => {
      const res = await request("/login");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("Administrator Sign In"));
      assert.ok(res.text.includes("admin@jms.gov.ph"));
    });

    // 3. Login Attempt Tracking (Invalid Credentials)
    await test("Login Attempt Tracking (Wrong password)", async () => {
      const res = await request("/login", {
        method: "POST",
        body: { email: "admin@jms.gov.ph", password: "WrongPassword999!" }
      });
      assert.strictEqual(res.status, 302);
      // Follow redirect to see flash message
      const resPage = await request("/login");
      assert.ok(resPage.text.includes("Invalid administrator credentials"));
    });

    // 4. Successful Admin Authentication
    await test("Admin Login (/login POST valid credentials)", async () => {
      const res = await request("/login", {
        method: "POST",
        body: { email: "admin@jms.gov.ph", password: "AdminPassword123!" }
      });
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.get("location").includes("/dashboard"));
      assert.ok(sessionCookie.length > 0, "Session cookie should be set");
    });

    // 5. Dashboard Page
    await test("Admin Dashboard (/dashboard)", async () => {
      const res = await request("/dashboard");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("System Administrator Dashboard"));
      assert.ok(res.text.includes("Total PDL"));
      assert.ok(res.text.includes("Currently Detained"));
      assert.ok(res.text.includes("Newly Registered"));
      assert.ok(res.text.includes("Released PDL"));
      assert.ok(res.text.includes("Total Personnel"));
      assert.ok(res.text.includes("Pending Actions"));
      assert.ok(res.text.includes("monthlyAdmissionChart"));
      assert.ok(res.text.includes("admissionReleaseChart"));
      assert.ok(res.text.includes("populationTrendChart"));
      assert.ok(res.text.includes("personnelChart"));
    });

    // 6. Personnel Directory & Creation
    let testPersonnelId = null;
    await test("Personnel Directory (/personnel)", async () => {
      const res = await request("/personnel");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("Personnel Directory"));
      assert.ok(res.text.includes("Leonardo Mendoza"));
    });

    await test("Personnel Creation (/personnel POST)", async () => {
      const badge = `P-TEST-${Date.now().toString().slice(-4)}`;
      const res = await request("/personnel", {
        method: "POST",
        body: {
          badge_number: badge,
          first_name: "Alexander",
          middle_name: "P.",
          last_name: "Reyes",
          rank: "Jail Officer 1 (JO1)",
          category: "Custodial / Gate Officer",
          email: `alex.${Date.now()}@bjmp.gov.ph`,
          phone: "+63 917 111 9999",
          emergency_contact: "Elena Reyes (+63 917 111 9998)",
          address: "Bicutan, Taguig City",
          notes: "Security test officer entry"
        }
      });
      assert.strictEqual(res.status, 302);
      const redirectLoc = res.headers.get("location");
      testPersonnelId = redirectLoc.split("/").pop();
      assert.ok(testPersonnelId && !isNaN(testPersonnelId));
    });

    await test("View Personnel Profile (/personnel/:id)", async () => {
      const res = await request(`/personnel/${testPersonnelId}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("Alexander Reyes"));
      assert.ok(res.text.includes("Custodial / Gate Officer"));
    });

    await test("Toggle Personnel Status (/personnel/:id/toggle-status)", async () => {
      const res = await request(`/personnel/${testPersonnelId}/toggle-status`, { method: "POST" });
      assert.strictEqual(res.status, 302);
      const resProfile = await request(`/personnel/${testPersonnelId}`);
      assert.ok(resProfile.text.includes("INACTIVE"));
    });

    await test("Toggle Personnel Lock (/personnel/:id/toggle-lock)", async () => {
      const res = await request(`/personnel/${testPersonnelId}/toggle-lock`, { method: "POST" });
      assert.strictEqual(res.status, 302);
      const resProfile = await request(`/personnel/${testPersonnelId}`);
      assert.ok(resProfile.text.includes("LOCKED"));
    });

    await test("Reset Personnel Password (/personnel/:id/reset-password)", async () => {
      const res = await request(`/personnel/${testPersonnelId}/reset-password`, { method: "POST" });
      assert.strictEqual(res.status, 302);
      const resProfile = await request(`/personnel/${testPersonnelId}`);
      assert.ok(resProfile.text.includes("Credentials reset for"));
    });

    // 7. PDL Records Module
    let testPdlId = null;
    await test("PDL Master List (/pdl)", async () => {
      const res = await request("/pdl");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("PDL Records Management"));
      assert.ok(res.text.includes("PDL-2026-0001"));
    });

    await test("PDL Record Creation (/pdl POST)", async () => {
      const pdlNum = `PDL-2026-${Date.now().toString().slice(-4)}`;
      const res = await request("/pdl", {
        method: "POST",
        body: {
          pdl_number: pdlNum,
          first_name: "Benjamin",
          middle_name: "Santos",
          last_name: "Alvarez",
          alias: "Benny",
          date_of_birth: "1989-07-15",
          gender: "Male",
          civil_status: "Married",
          nationality: "Filipino",
          address: "Cubao, Quezon City",
          emergency_contact_name: "Grace Alvarez (Wife)",
          emergency_contact_phone: "+63 920 123 4567",
          case_number: "CR-2026-TEST",
          court_branch: "RTC Branch 89, QC",
          offense_charge: "Illegal Possession of Controlled Items",
          risk_level: "High",
          cell_block: "Block A - Cell 09",
          admission_date: "2026-10-25",
          detention_status: "Detained",
          remarks: "Automated test intake verification"
        }
      });
      assert.strictEqual(res.status, 302);
      const redirectLoc = res.headers.get("location");
      testPdlId = redirectLoc.split("/").pop();
      assert.ok(testPdlId && !isNaN(testPdlId));
    });

    await test("View PDL Dossier (/pdl/:id)", async () => {
      const res = await request(`/pdl/${testPdlId}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("Benjamin"));
      assert.ok(res.text.includes("Alvarez"));
      assert.ok(res.text.includes("CR-2026-TEST"));
    });

    await test("Export PDL CSV (/pdl/export/csv)", async () => {
      const res = await request("/pdl/export/csv");
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers.get("content-type").includes("text/csv"));
      assert.ok(res.text.includes("PDL Number"));
      assert.ok(res.text.includes("Ramon"));
    });

    await test("Export PDL Excel (/pdl/export/excel)", async () => {
      const res = await request("/pdl/export/excel");
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers.get("content-type").includes("vnd.ms-excel"));
      assert.ok(res.text.includes("Worksheet"));
    });

    await test("Export PDL PDF View (/pdl/export/pdf)", async () => {
      const res = await request("/pdl/export/pdf");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("OFFICIAL MASTER ROSTER"));
      assert.ok(res.text.includes("Bureau of Jail Management and Penology"));
    });

    // 8. System Settings
    await test("Settings View (/settings)", async () => {
      const res = await request("/settings");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("Jail Facility Information"));
      assert.ok(res.text.includes("Metropolitan Regional Correctional Facility"));
    });

    await test("Update Settings (/settings POST)", async () => {
      const res = await request("/settings", {
        method: "POST",
        body: {
          facility_name: "Metropolitan Regional Correctional Facility",
          facility_code: "MRCF-NCR-01",
          session_timeout_minutes: "45",
          max_login_attempts: "5"
        }
      });
      assert.strictEqual(res.status, 302);
      const resSettings = await request("/settings");
      assert.ok(resSettings.text.includes("45"));
    });

    // 9. Database Backup Management
    let testBackupId = null;
    await test("Database Backups List (/backups)", async () => {
      const res = await request("/backups");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("Database Backup & Disaster Recovery"));
    });

    await test("Trigger Database Backup (/backups/create POST)", async () => {
      const res = await request("/backups/create", {
        method: "POST",
        body: { backup_type: "Manual", notes: "Test suite automated backup" }
      });
      assert.strictEqual(res.status, 302);
      const resList = await request("/backups");
      assert.ok(resList.text.includes("jms_backup_"));
    });

    // 10. Audit Logs
    await test("Audit Trail (/audit-logs)", async () => {
      const res = await request("/audit-logs");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("Audit Logs & Forensic Trail"));
      assert.ok(res.text.includes("LOGIN_SUCCESS"));
    });

    await test("Audit Trail CSV Export (/audit-logs/export/csv)", async () => {
      const res = await request("/audit-logs/export/csv");
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers.get("content-type").includes("text/csv"));
      assert.ok(res.text.includes("Timestamp"));
    });

    // 11. Notification Center
    await test("Notifications View (/notifications)", async () => {
      const res = await request("/notifications");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("Notification Center"));
    });

    await test("Notifications Unread API (/api/notifications/unread-count)", async () => {
      const res = await request("/api/notifications/unread-count");
      assert.strictEqual(res.status, 200);
      const data = JSON.parse(res.text);
      assert.ok(typeof data.unreadCount === "number");
    });

    await test("Mark All Notifications Read (/notifications/read-all POST)", async () => {
      const res = await request("/notifications/read-all", { method: "POST" });
      assert.strictEqual(res.status, 302);
    });

    // 12. Reports Center
    await test("Reports Overview (/reports)", async () => {
      const res = await request("/reports");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("Administrative Reports & Intelligence"));
      assert.ok(res.text.includes("1. PDL Population Report"));
      assert.ok(res.text.includes("2. PDL Admission Report"));
      assert.ok(res.text.includes("3. PDL Release Report"));
      assert.ok(res.text.includes("4. Personnel Account Report"));
      assert.ok(res.text.includes("5. Audit Trail Report"));
      assert.ok(res.text.includes("6. Database Backup Report"));
    });

    await test("Report Preview: PDL Population (/reports/pdl-population)", async () => {
      const res = await request("/reports/pdl-population");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("PDL POPULATION DEMOGRAPHIC"));
    });

    await test("Report Export CSV: PDL Admission (/reports/pdl-admission?format=csv)", async () => {
      const res = await request("/reports/pdl-admission?format=csv");
      assert.strictEqual(res.status, 200);
      assert.ok(res.headers.get("content-type").includes("text/csv"));
      assert.ok(res.text.includes("PDL Number"));
    });

    // 13. Admin Profile
    await test("Profile View (/profile)", async () => {
      const res = await request("/profile");
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes("System Administrator Profile"));
      assert.ok(res.text.includes("Captain Arthur M. Reyes"));
    });

    // 14. Admin Logout & Post-Logout Protection
    await test("Admin Logout (/logout)", async () => {
      const res = await request("/logout");
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.get("location").includes("/login"));
    });

    await test("Post-Logout Protection (/dashboard redirected to /login)", async () => {
      const res = await request("/dashboard");
      assert.strictEqual(res.status, 302);
      assert.ok(res.headers.get("location").includes("/login"));
    });

  } finally {
    server.close();
    console.log("\n==========================================");
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED:      ${passed}`);
    console.log(`FAILED:      ${failed}`);
    console.log("==========================================");

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

