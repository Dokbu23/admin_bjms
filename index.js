/*
  Jail Management System (JMS) - System Administrator Portal
  Built on XianFire Framework
  Mindoro State University - Philippines
*/
import express from "express";
import path from "path";
import session from "express-session";
import flash from "connect-flash";
import router from "./routes/index.js";
import fs from "fs";
import hbs from "hbs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";
import { FacilitySetting } from "./models/settingModel.js";
import { Notification } from "./models/notificationModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from both dirname and cwd
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(process.cwd(), "public")));

// Session configuration
app.use(
  session({
    secret: "jms-xianfire-admin-secure-session-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4, // 4 hours
      httpOnly: true
    }
  })
);
app.use(flash());

// Register .xian template engine powered by Handlebars
app.engine("xian", async (filePath, options, callback) => {
  try {
    const originalPartialsDir = hbs.partialsDir;
    hbs.partialsDir = path.join(__dirname, "views");

    const result = await new Promise((resolve, reject) => {
      hbs.__express(filePath, options, (err, html) => {
        if (err) return reject(err);
        resolve(html);
      });
    });

    hbs.partialsDir = originalPartialsDir;
    callback(null, result);
  } catch (err) {
    callback(err);
  }
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "xian");

// Register all Handlebars helpers
hbs.registerHelper("eq", (a, b) => a == b);
hbs.registerHelper("ne", (a, b) => a != b);
hbs.registerHelper("and", (a, b) => Boolean(a && b));
hbs.registerHelper("or", (a, b) => Boolean(a || b));
hbs.registerHelper("gt", (a, b) => Number(a) > Number(b));
hbs.registerHelper("lt", (a, b) => Number(a) < Number(b));
hbs.registerHelper("add", (a, b) => Number(a) + Number(b));
hbs.registerHelper("subtract", (a, b) => Number(a) - Number(b));
hbs.registerHelper("contains", (str, sub) => (str && typeof str === "string" ? str.includes(sub) : false));
hbs.registerHelper("json", context => JSON.stringify(context || {}));

hbs.registerHelper("formatDate", dateVal => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return dateVal;
  return d.toISOString().slice(0, 10);
});

hbs.registerHelper("formatDateTime", dateVal => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return dateVal;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
});

hbs.registerHelper("formatBytes", bytes => {
  if (!bytes || bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb > 1024) return (kb / 1024).toFixed(1) + " MB";
  return kb.toFixed(1) + " KB";
});

hbs.registerHelper("statusBadge", status => {
  const s = String(status || "").toLowerCase();
  if (s === "active" || s === "released" || s === "completed") {
    return new hbs.SafeString(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">${status}</span>`);
  }
  if (s === "on trial" || s === "manual" || s === "pending") {
    return new hbs.SafeString(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">${status}</span>`);
  }
  if (s === "inactive" || s === "medical facility") {
    return new hbs.SafeString(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">${status}</span>`);
  }
  if (s === "locked" || s === "convicted" || s === "failed" || s === "maximum") {
    return new hbs.SafeString(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">${status}</span>`);
  }
  return new hbs.SafeString(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">${status}</span>`);
});

hbs.registerHelper("riskBadge", risk => {
  const r = String(risk || "").toLowerCase();
  if (r === "maximum") {
    return new hbs.SafeString(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-900 text-purple-100 border border-purple-800">MAXIMUM</span>`);
  }
  if (r === "high") {
    return new hbs.SafeString(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">HIGH</span>`);
  }
  if (r === "medium") {
    return new hbs.SafeString(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">MEDIUM</span>`);
  }
  return new hbs.SafeString(`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">LOW</span>`);
});

// Synchronously register all partials from views/partials/
const partialsDir = path.join(__dirname, "views/partials");
if (fs.existsSync(partialsDir)) {
  const files = fs.readdirSync(partialsDir);
  files
    .filter(file => file.endsWith(".xian"))
    .forEach(file => {
      const partialName = file.replace(".xian", "");
      const fullPath = path.join(partialsDir, file);
      const content = fs.readFileSync(fullPath, "utf8");
      hbs.registerPartial(partialName, content);
    });
  console.log(`✅ ${files.filter(f => f.endsWith(".xian")).length} XianFire partials registered.`);
}

// Global View Context Middleware
app.use(async (req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.info_msg = req.flash("info_msg");
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.session?.user || null;

  // Cached facility branding
  try {
    const fSetting = await FacilitySetting.findOne({ where: { key: "facility_name" } });
    const cSetting = await FacilitySetting.findOne({ where: { key: "facility_code" } });
    res.locals.facilityName = fSetting ? fSetting.value : "Metropolitan Regional Correctional Facility";
    res.locals.facilityCode = cSetting ? cSetting.value : "MRCF-NCR-01";

    if (req.session?.userId) {
      res.locals.unreadNotificationCount = await Notification.count({ where: { is_read: false } });
    } else {
      res.locals.unreadNotificationCount = 0;
    }
  } catch (_) {
    res.locals.facilityName = "Metropolitan Regional Correctional Facility";
    res.locals.facilityCode = "MRCF-NCR-01";
    res.locals.unreadNotificationCount = 0;
  }

  next();
});

// Mount Routes
app.use("/", router);

// 404 Handler
app.use((req, res) => {
  res.status(404).render("404", {
    title: "Page Not Found | JMS Administrator",
    layout: false
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  res.status(500).render("500", {
    title: "System Error | JMS Administrator",
    error: err.message,
    layout: false
  });
});

export default app;

// Start Server helper
export const startServer = (port = PORT) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`🔥 JMS Administrator running on XianFire at http://localhost:${port}`);
      resolve(server);
    });
    server.on("error", reject);
  });
};

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun && !process.env.XIAN_ELECTRON) {
  startServer();
}
