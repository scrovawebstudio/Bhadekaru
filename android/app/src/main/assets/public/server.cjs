var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Client-Platform, X-Org-Id");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(import_express.default.json({ limit: "30mb" }));
var SYNC_DIR = import_path.default.join(process.cwd(), "data", "sync");
if (!import_fs.default.existsSync(SYNC_DIR)) {
  import_fs.default.mkdirSync(SYNC_DIR, { recursive: true });
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/sync/status", (req, res) => {
  const orgId = String(req.query.orgId || "default").replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = import_path.default.join(SYNC_DIR, `${orgId}.json`);
  if (!import_fs.default.existsSync(filePath)) {
    return res.json({ exists: false, orgId });
  }
  try {
    const raw = import_fs.default.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return res.json({
      exists: true,
      orgId,
      version: parsed.version || 1,
      lastModified: parsed.lastModified || null,
      lastModifiedByPlatform: parsed.lastModifiedByPlatform || "unknown"
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to read sync status" });
  }
});
app.get("/api/sync/pull", (req, res) => {
  const orgId = String(req.query.orgId || "default").replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = import_path.default.join(SYNC_DIR, `${orgId}.json`);
  if (!import_fs.default.existsSync(filePath)) {
    return res.json({ exists: false, orgId });
  }
  try {
    const raw = import_fs.default.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return res.json({
      exists: true,
      orgId,
      version: data.version,
      lastModified: data.lastModified,
      lastModifiedByPlatform: data.lastModifiedByPlatform,
      state: data.state
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to read sync data" });
  }
});
app.post("/api/sync/push", (req, res) => {
  const { orgId, state, platform } = req.body || {};
  if (!state || typeof state !== "object") {
    return res.status(400).json({ error: "Invalid sync payload: state is required" });
  }
  const cleanOrgId = String(orgId || state.currentOrgId || "default").replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = import_path.default.join(SYNC_DIR, `${cleanOrgId}.json`);
  let currentVersion = 0;
  if (import_fs.default.existsSync(filePath)) {
    try {
      const existing = JSON.parse(import_fs.default.readFileSync(filePath, "utf-8"));
      currentVersion = existing.version || 0;
    } catch {
    }
  }
  const newVersion = currentVersion + 1;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const payload = {
    orgId: cleanOrgId,
    version: newVersion,
    lastModified: now,
    lastModifiedByPlatform: platform || "web",
    state
  };
  try {
    const tempPath = `${filePath}.tmp`;
    import_fs.default.writeFileSync(tempPath, JSON.stringify(payload), "utf-8");
    import_fs.default.renameSync(tempPath, filePath);
    return res.json({
      success: true,
      orgId: cleanOrgId,
      version: newVersion,
      lastModified: now,
      message: "Cloud sync successfully saved"
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to write cloud sync payload" });
  }
});
app.post("/api/admin/login", (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: "Identifier and password are required" });
  }
  const cleanIdentifier = String(identifier).trim().toLowerCase();
  const cleanPhone = cleanIdentifier.replace(/[^0-9]/g, "");
  const envAdminPhone = (process.env.SUPER_ADMIN_PHONE || "8149862034").trim();
  const envAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "scrovawebstudio@gmail.com").trim().toLowerCase();
  const envAdminPassword = (process.env.SUPER_ADMIN_PASSWORD || "814986").trim();
  const isPasswordValid = String(password).trim() === envAdminPassword;
  const isPhoneMatch = cleanPhone.endsWith(envAdminPhone) || cleanPhone === envAdminPhone || cleanIdentifier === envAdminPhone;
  const isEmailMatch = cleanIdentifier === envAdminEmail || cleanIdentifier === "admin@bhadekaru.app";
  if ((isPhoneMatch || isEmailMatch) && isPasswordValid) {
    return res.json({
      success: true,
      message: "Super Admin authenticated successfully",
      user: {
        userId: "usr-super-admin",
        email: envAdminEmail,
        phone: envAdminPhone,
        fullName: "Super Admin",
        role: "super_admin",
        organizationId: "org-platform-admin",
        organizationName: "Bhadekaru SaaS Platform Governance",
        loginTime: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  }
  return res.status(401).json({
    error: "Invalid credentials. Please verify your Super Admin phone/email and password."
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bhadekaru SaaS server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
