const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const bookingsPath = path.join(dataDir, "bookings.json");
const port = Number(process.env.PORT || 8765);
const databaseUrl = process.env.DATABASE_URL;
let pool;
let databaseReady = false;

const slotTimes = ["8:00 AM", "9:30 AM", "11:00 AM", "1:00 PM", "2:30 PM", "4:00 PM"];
const requiredFields = [
  "date",
  "time",
  "customerName",
  "customerPhone",
  "customerEmail",
  "serviceType",
  "deviceInfo",
  "issueDescription"
];

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(bookingsPath);
  } catch (error) {
    await fs.writeFile(bookingsPath, "[]\n", "utf8");
  }
}

async function readBookings() {
  await ensureStore();
  const raw = await fs.readFile(bookingsPath, "utf8");
  const bookings = JSON.parse(raw || "[]");
  return Array.isArray(bookings) ? bookings : [];
}

async function writeBookings(bookings) {
  await ensureStore();
  await fs.writeFile(bookingsPath, `${JSON.stringify(bookings, null, 2)}\n`, "utf8");
}

function useDatabase() {
  return Boolean(databaseUrl);
}

function getPool() {
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
  }

  return pool;
}

async function ensureDatabase() {
  if (!useDatabase() || databaseReady) {
    return;
  }

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id uuid PRIMARY KEY,
      appointment_date date NOT NULL,
      appointment_time text NOT NULL,
      customer_name text NOT NULL,
      customer_phone text NOT NULL,
      customer_email text NOT NULL,
      service_type text NOT NULL,
      device_info text NOT NULL,
      issue_description text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (appointment_date, appointment_time)
    )
  `);
  databaseReady = true;
}

function rowToBooking(row) {
  return {
    id: row.id,
    date: row.appointment_date instanceof Date ? row.appointment_date.toISOString().slice(0, 10) : String(row.appointment_date).slice(0, 10),
    time: row.appointment_time,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    serviceType: row.service_type,
    deviceInfo: row.device_info,
    issueDescription: row.issue_description,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

async function listBookings() {
  if (!useDatabase()) {
    return readBookings();
  }

  await ensureDatabase();
  const result = await getPool().query(`
    SELECT
      id,
      appointment_date,
      appointment_time,
      customer_name,
      customer_phone,
      customer_email,
      service_type,
      device_info,
      issue_description,
      created_at
    FROM bookings
    ORDER BY appointment_date, appointment_time
  `);
  return result.rows.map(rowToBooking);
}

async function createBooking(booking) {
  const bookingToSave = {
    id: crypto.randomUUID(),
    ...booking,
    createdAt: new Date().toISOString()
  };

  if (!useDatabase()) {
    const bookings = await readBookings();
    const isTaken = bookings.some((existing) => {
      return existing.date === booking.date && existing.time === booking.time;
    });

    if (isTaken) {
      return { conflict: true };
    }

    bookings.push(bookingToSave);
    await writeBookings(bookings);
    return { booking: bookingToSave };
  }

  await ensureDatabase();

  try {
    const result = await getPool().query(
      `
        INSERT INTO bookings (
          id,
          appointment_date,
          appointment_time,
          customer_name,
          customer_phone,
          customer_email,
          service_type,
          device_info,
          issue_description,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          id,
          appointment_date,
          appointment_time,
          customer_name,
          customer_phone,
          customer_email,
          service_type,
          device_info,
          issue_description,
          created_at
      `,
      [
        bookingToSave.id,
        bookingToSave.date,
        bookingToSave.time,
        bookingToSave.customerName,
        bookingToSave.customerPhone,
        bookingToSave.customerEmail,
        bookingToSave.serviceType,
        bookingToSave.deviceInfo,
        bookingToSave.issueDescription,
        bookingToSave.createdAt
      ]
    );
    return { booking: rowToBooking(result.rows[0]) };
  } catch (error) {
    if (error.code === "23505") {
      return { conflict: true };
    }

    throw error;
  }
}

async function clearBookings() {
  if (!useDatabase()) {
    await writeBookings([]);
    return;
  }

  await ensureDatabase();
  await getPool().query("DELETE FROM bookings");
}

async function deleteBooking(id) {
  if (!useDatabase()) {
    const bookings = await readBookings();
    const remaining = bookings.filter((booking) => booking.id !== id);

    if (remaining.length === bookings.length) {
      return false;
    }

    await writeBookings(remaining);
    return true;
  }

  await ensureDatabase();
  const result = await getPool().query("DELETE FROM bookings WHERE id = $1", [id]);
  return result.rowCount > 0;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function isValidDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false;
  }

  const date = new Date(`${dateKey}T12:00:00`);
  return !Number.isNaN(date.getTime()) && dateKey === date.toISOString().slice(0, 10);
}

function isClosedOrPast(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = date.getDay();
  return checkDate < todayOnly || day === 0 || day === 6;
}

function cleanString(value) {
  return String(value || "").trim();
}

function validateBooking(input) {
  const booking = {};

  for (const field of requiredFields) {
    booking[field] = cleanString(input[field]);

    if (!booking[field]) {
      return { error: `${field} is required.` };
    }
  }

  if (!isValidDateKey(booking.date)) {
    return { error: "Choose a valid appointment date." };
  }

  if (isClosedOrPast(booking.date)) {
    return { error: "Appointments are available on upcoming weekdays only." };
  }

  if (!slotTimes.includes(booking.time)) {
    return { error: "Choose a valid appointment time." };
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(booking.customerEmail)) {
    return { error: "Enter a valid email address." };
  }

  return { booking };
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);

    if (Buffer.concat(chunks).length > 100_000) {
      throw new Error("Request body is too large.");
    }
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function publicBooking(booking) {
  return {
    date: booking.date,
    time: booking.time
  };
}

function privateBooking(booking) {
  return {
    id: booking.id,
    date: booking.date,
    time: booking.time,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    serviceType: booking.serviceType,
    deviceInfo: booking.deviceInfo,
    issueDescription: booking.issueDescription,
    createdAt: booking.createdAt
  };
}

function isAdminRequest(req) {
  return Boolean(process.env.ADMIN_TOKEN) && req.headers["x-admin-token"] === process.env.ADMIN_TOKEN;
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, slots: slotTimes, storage: useDatabase() ? "postgres" : "json" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/bookings") {
    const bookings = await listBookings();
    sendJson(res, 200, { bookings: bookings.map(publicBooking) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/availability") {
    const date = url.searchParams.get("date");

    if (!date || !isValidDateKey(date)) {
      sendJson(res, 400, { error: "A valid date query is required." });
      return;
    }

    const bookings = await listBookings();
    const bookedTimes = bookings.filter((booking) => booking.date === date).map((booking) => booking.time);
    sendJson(res, 200, {
      date,
      slots: slotTimes.map((time) => ({
        time,
        available: !bookedTimes.includes(time) && !isClosedOrPast(date)
      }))
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/bookings") {
    const body = await readRequestBody(req);
    const validation = validateBooking(body);

    if (validation.error) {
      sendJson(res, 400, { error: validation.error });
      return;
    }

    const result = await createBooking(validation.booking);

    if (result.conflict) {
      sendJson(res, 409, { error: "That appointment time is already booked." });
      return;
    }

    sendJson(res, 201, { booking: privateBooking(result.booking) });
    return;
  }

  if (req.method === "DELETE" && url.pathname === "/api/bookings") {
    if (!isAdminRequest(req)) {
      sendJson(res, 403, { error: "Admin token is required." });
      return;
    }

    await clearBookings();
    sendJson(res, 200, { ok: true });
    return;
  }

  const deleteMatch = url.pathname.match(/^\/api\/bookings\/([^/]+)$/);

  if (req.method === "DELETE" && deleteMatch) {
    if (!isAdminRequest(req)) {
      sendJson(res, 403, { error: "Admin token is required." });
      return;
    }

    const id = decodeURIComponent(deleteMatch[1]);
    const deleted = await deleteBooking(id);

    if (!deleted) {
      sendJson(res, 404, { error: "Booking was not found." });
      return;
    }

    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: "API route was not found." });
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === "/" ? "/scheduling-redesign-preview.html" : url.pathname;
  const safePath = path.normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml"
    };

    res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    sendText(res, 404, "Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error." });
  }
});

server.listen(port, () => {
  const storage = useDatabase() ? "Neon/Postgres" : "local JSON";
  console.log(`Scheduling backend running at http://127.0.0.1:${port} using ${storage}`);
});
