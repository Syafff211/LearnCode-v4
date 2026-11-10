/**
 * Minimal local stand-in for Supabase (PostgREST + GoTrue subset).
 *
 * This exists ONLY so the app can be exercised end-to-end in a sandbox without
 * Docker. It implements the handful of endpoints the app uses, executes SQL
 * against the real migrated Postgres schema (so RLS, triggers, constraints and
 * the quota function are genuinely exercised), and issues real HS256 JWTs.
 *
 * It is NOT a Supabase replacement and is never imported by application code.
 *
 *   node tests/support/supabase-shim.mjs
 *
 * Env:
 *   SHIM_DATABASE_URL  (default postgresql://learncode_test:learncode_test@127.0.0.1:5432/learncode_test)
 *   SHIM_PORT          (default 54321)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import pg from "pg";

const PORT = Number(process.env.SHIM_PORT ?? 54321);
const DATABASE_URL =
  process.env.SHIM_DATABASE_URL ??
  "postgresql://learncode_test:learncode_test@127.0.0.1:5432/learncode_test";
const CREDENTIALS_FILE = "/tmp/learncode-shim-credentials.json";

const ANON_KEY = "local-anon-key";
const SERVICE_ROLE_KEY = "local-service-role-key";
const JWT_SECRET = "local-dev-jwt-secret";

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });

function loadCredentials() {
  try {
    return new Map(Object.entries(JSON.parse(fs.readFileSync(CREDENTIALS_FILE, "utf8"))));
  } catch {
    return new Map();
  }
}
const credentials = loadCredentials();
function saveCredentials() {
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(Object.fromEntries(credentials)), "utf8");
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signJwt(payload) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token) {
  try {
    const [header, body, signature] = token.split(".");
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function issueSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = signJwt({
    sub: user.id,
    email: user.email,
    role: "authenticated",
    aud: "authenticated",
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
  });
  const refreshToken = crypto.randomBytes(16).toString("hex");
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 60 * 60 * 24 * 7,
    expires_at: now + 60 * 60 * 24 * 7,
    refresh_token: refreshToken,
    user,
  };
}

function publicUser(row) {
  return {
    id: row.id,
    aud: "authenticated",
    role: "authenticated",
    email: row.email,
    email_confirmed_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: row.raw_user_meta_data ?? {},
    identities: [],
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ REST --- */

const RESERVED_PARAMS = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);

function parseQuery(searchParams) {
  const filters = [];
  const options = { select: "*", order: [], limit: null, offset: null, onConflict: null };
  for (const [key, rawValue] of searchParams.entries()) {
    if (key === "select") {
      options.select = rawValue;
      continue;
    }
    if (key === "order") {
      for (const part of rawValue.split(",")) {
        const [column, ...modifiers] = part.split(".");
        options.order.push({
          column,
          ascending: !modifiers.includes("desc"),
          nullsFirst: modifiers.includes("nullsfirst"),
        });
      }
      continue;
    }
    if (key === "limit") {
      options.limit = Number(rawValue);
      continue;
    }
    if (key === "offset") {
      options.offset = Number(rawValue);
      continue;
    }
    if (key === "on_conflict") {
      options.onConflict = rawValue;
      continue;
    }
    if (RESERVED_PARAMS.has(key)) continue;

    const [operator, ...rest] = rawValue.split(".");
    const value = rest.join(".");
    if (operator === "eq") filters.push({ column: key, operator, value });
    else if (operator === "neq") filters.push({ column: key, operator, value });
    else if (operator === "is") filters.push({ column: key, operator, value });
    else if (operator === "in") {
      filters.push({
        column: key,
        operator,
        value: value.replace(/^\(|\)$/g, "").split(",").map((entry) => entry.replace(/^"|"$/g, "")),
      });
    } else if (operator === "gte" || operator === "lte" || operator === "gt" || operator === "lt") {
      filters.push({ column: key, operator, value });
    }
  }
  return { filters, options };
}

function buildWhere(filters, params) {
  if (filters.length === 0) return "";
  const clauses = filters.map((filter) => {
    const placeholder = `$${params.push(filter.value)}`;
    switch (filter.operator) {
      case "eq":
        return `"${filter.column}" = ${placeholder}`;
      case "neq":
        return `"${filter.column}" <> ${placeholder}`;
      case "is":
        return filter.value === "null"
          ? `"${filter.column}" is null`
          : `"${filter.column}" is ${filter.value}`;
      case "in":
        return `"${filter.column}" = any(${placeholder})`;
      case "gte":
        return `"${filter.column}" >= ${placeholder}`;
      case "lte":
        return `"${filter.column}" <= ${placeholder}`;
      case "gt":
        return `"${filter.column}" > ${placeholder}`;
      case "lt":
        return `"${filter.column}" < ${placeholder}`;
      default:
        return "true";
    }
  });
  return ` where ${clauses.join(" and ")}`;
}

function selectList(select) {
  if (!select || select === "*") return "*";
  return select
    .split(",")
    .map((column) => `"${column.trim()}"`)
    .join(", ");
}

const jsonColumnCache = new Map();

async function jsonColumns(table) {
  if (jsonColumnCache.has(table)) return jsonColumnCache.get(table);
  const result = await pool.query(
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = $1 and data_type in ('json', 'jsonb')`,
    [table],
  );
  const columns = new Set(result.rows.map((row) => row.column_name));
  jsonColumnCache.set(table, columns);
  return columns;
}

function parameterValue(value, isJson) {
  if (value === undefined) return null;
  if (isJson && value !== null && typeof value === "object") return JSON.stringify(value);
  return value;
}

async function withRole(role, userId, callback) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${role}`);
    if (userId) {
      await client.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
      await client.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: userId, role: "authenticated" }),
      ]);
    } else {
      await client.query("select set_config('request.jwt.claim.sub', '', true)");
    }
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function send(res, status, body, headers = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    "Access-Control-Allow-Origin": "*",
    ...headers,
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function authContext(req) {
  const header = req.headers.authorization ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token || token === ANON_KEY) return { role: "anon", userId: null };
  if (token === SERVICE_ROLE_KEY) return { role: "service_role", userId: null, service: true };
  const claims = verifyJwt(token);
  if (!claims?.sub) return { role: "anon", userId: null };
  return { role: "authenticated", userId: claims.sub };
}

async function handleRest(req, res, url) {
  const path = url.pathname.replace(/^\/rest\/v1\//, "");
  const ctx = authContext(req);

  if (path.startsWith("rpc/")) {
    const fn = path.slice("rpc/".length);
    const body = (await readBody(req)) ?? {};

    // Generic RPC bridge for the local harness: resolve the function in the
    // public schema, bind named arguments, and let PostgreSQL enforce grants
    // and SECURITY DEFINER rules exactly like PostgREST would.
    if (!/^[a-z_][a-z0-9_]*$/i.test(fn)) {
      return send(res, 404, { message: "rpc not found" });
    }
    const meta = await pool.query(
      `select p.proretset
       from pg_proc p
       where p.pronamespace = 'public'::regnamespace and p.proname = $1
       limit 1`,
      [fn],
    );
    if (meta.rows.length === 0) return send(res, 404, { message: "rpc not found" });

    const entries = Object.entries(body).filter(([key]) => /^[a-z_][a-z0-9_]*$/i.test(key));
    const args = entries.map(([key], index) => `"${key}" => $${index + 1}`);
    const values = entries.map(([, value]) => value);
    const call = `public."${fn}"(${args.join(", ")})`;
    const sql = meta.rows[0].proretset ? `select * from ${call}` : `select ${call} as value`;

    try {
      const result = await withRole(ctx.role, ctx.userId, (client) => client.query(sql, values));
      if (meta.rows[0].proretset) return send(res, 200, result.rows);
      return send(res, 200, result.rows[0]?.value ?? null);
    } catch (error) {
      const code = error?.code ?? "";
      if (code === "42883") return send(res, 404, { message: "rpc not found" });
      if (code === "42501") return send(res, 403, { message: "permission denied for function" });
      return send(res, 400, { message: error?.message ?? "rpc failed" });
    }
  }

  const table = path;
  const { filters, options } = parseQuery(url.searchParams);

  if (req.method === "GET" || req.method === "HEAD") {
    const params = [];
    const where = buildWhere(filters, params);
    const order = options.order.length
      ? ` order by ${options.order
          .map((entry) => `"${entry.column}" ${entry.ascending ? "asc" : "desc"}`)
          .join(", ")}`
      : "";
    const limit = options.limit ? ` limit ${options.limit}` : "";
    const rows = await withRole(ctx.role, ctx.userId, (client) =>
      client.query(
        `select ${selectList(options.select)} from public."${table}"${where}${order}${limit}`,
        params,
      ),
    );

    const prefer = req.headers.prefer ?? "";
    let total = null;
    if (/count=(exact|planned|estimated)/.test(prefer)) {
      const countParams = [];
      const countWhere = buildWhere(filters, countParams);
      const counted = await withRole(ctx.role, ctx.userId, (client) =>
        client.query(`select count(*)::int as total from public."${table}"${countWhere}`, countParams),
      );
      total = counted.rows[0]?.total ?? 0;
    }
    const rangeHeaders =
      total === null
        ? {}
        : {
            "Content-Range": `${rows.rows.length === 0 ? "*" : `0-${rows.rows.length - 1}`}/${total}`,
          };

    if (req.method === "HEAD") {
      return send(res, 200, undefined, rangeHeaders);
    }

    const wantsObject = (req.headers.accept ?? "").includes("vnd.pgrst.object");
    if (wantsObject) {
      if (rows.rows.length === 0) {
        return send(res, 406, {
          code: "PGRST116",
          details: "The result contains 0 rows",
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned",
        });
      }
      return send(res, 200, rows.rows[0], rangeHeaders);
    }
    return send(res, 200, rows.rows, rangeHeaders);
  }

  if (req.method === "POST" || req.method === "PATCH") {
    const body = await readBody(req);
    const rows = Array.isArray(body) ? body : [body];
    if (rows.length === 0) return send(res, 201, []);
    const jsonCols = await jsonColumns(table);

    const prefer = req.headers.prefer ?? "";
    const isInsert = req.method === "POST";
    const ignoresDuplicates = isInsert && prefer.includes("resolution=ignore-duplicates");
    const isUpsert =
      isInsert &&
      (prefer.includes("resolution=merge-duplicates") ||
        prefer.includes("resolution=ignore-duplicates"));
    const columns = Object.keys(rows[0]);
    const params = [];

    let sql;
    if (isInsert) {
      const columnList = columns.map((column) => `"${column}"`).join(", ");
      const rowPlaceholders = rows.map(
        (row) =>
          `(${columns
            .map(
              (column) =>
                `$${params.push(parameterValue(row[column], jsonCols.has(column)))}`,
            )
            .join(", ")})`,
      );
      if (isUpsert) {
        const conflict = options.onConflict
          ? options.onConflict.split(",").map((column) => `"${column.trim()}"`).join(", ")
          : null;
        const updateSet = columns
          .filter((column) => conflict === null || !conflict.includes(`"${column}"`))
          .map((column) => `"${column}" = excluded."${column}"`)
          .join(", ");
        const conflictTarget = conflict ?? "id";
        sql = `insert into public."${table}" (${columnList}) values ${rowPlaceholders.join(", ")}
               on conflict (${conflictTarget}) do ${
                 ignoresDuplicates || !updateSet ? "nothing" : `update set ${updateSet}`
               }
               returning *`;
      } else {
        sql = `insert into public."${table}" (${columnList}) values ${rowPlaceholders.join(", ")} returning *`;
      }
    } else {
      const setClause = columns
        .map(
          (column) =>
            `"${column}" = $${params.push(parameterValue(rows[0][column], jsonCols.has(column)))}`,
        )
        .join(", ");
      const whereSql = buildWhere(filters, params);
      sql = `update public."${table}" set ${setClause}${whereSql} returning *`;
    }

    const result = await withRole(ctx.role, ctx.userId, (client) =>
      client.query(sql, params),
    );
    const wantsRepresentation = (req.headers.prefer ?? "").includes("return=representation") ||
      isInsert;
    const wantsObject = (req.headers.accept ?? "").includes("vnd.pgrst.object");
    if (!wantsRepresentation) return send(res, 204, undefined);
    if (wantsObject) {
      if (result.rows.length === 0) return send(res, 406, { code: "PGRST116" });
      return send(res, 200, result.rows[0]);
    }
    return send(res, isInsert ? 201 : 200, result.rows);
  }

  if (req.method === "DELETE") {
    const params = [];
    const where = buildWhere(filters, params);
    const result = await withRole(ctx.role, ctx.userId, (client) =>
      client.query(`delete from public."${table}"${where} returning *`, params),
    );
    const wantsObject = (req.headers.accept ?? "").includes("vnd.pgrst.object");
    if (wantsObject) {
      if (result.rows.length === 0) return send(res, 406, { code: "PGRST116" });
      return send(res, 200, result.rows[0]);
    }
    return send(res, 200, result.rows);
  }

  return send(res, 405, { message: "method not allowed" });
}

/* ------------------------------------------------------------------ Auth --- */

async function findUserByEmail(email) {
  const result = await pool.query("select * from auth.users where email = $1", [email]);
  return result.rows[0] ?? null;
}

async function findUserById(id) {
  const result = await pool.query("select * from auth.users where id = $1", [id]);
  return result.rows[0] ?? null;
}

async function handleAuth(req, res, url) {
  const path = url.pathname.replace(/^\/auth\/v1/, "");
  const body = (await readBody(req)) ?? {};

  if (path === "/signup" && req.method === "POST") {
    const email = String(body.email ?? "").toLowerCase();
    const existing = await findUserByEmail(email);
    if (existing) {
      return send(res, 400, {
        code: 422,
        msg: "User already registered",
        message: "User already registered",
        error_code: "user_already_exists",
      });
    }
    // The schema's trigger creates the profile from these metadata fields.
    const inserted = await pool.query(
      `insert into auth.users (email, raw_user_meta_data) values ($1, $2)
       returning id, email, raw_user_meta_data, created_at`,
      [email, body.data ?? {}],
    );
    const row = inserted.rows[0];
    credentials.set(email, body.password ?? "");
    saveCredentials();
    const user = publicUser(row);
    // emailRedirectTo is ignored: this harness confirms immediately.
    return send(res, 200, { ...issueSession(user), user });
  }

  if (path === "/token" && req.method === "POST") {
    const grant = url.searchParams.get("grant_type");
    if (grant === "password") {
      const email = String(body.email ?? "").toLowerCase();
      const row = await findUserByEmail(email);
      const stored = credentials.get(email);
      if (!row || stored === undefined || stored !== body.password) {
        return send(res, 400, {
          code: 400,
          error_code: "invalid_credentials",
          msg: "Invalid login credentials",
          message: "Invalid login credentials",
        });
      }
      return send(res, 200, issueSession(publicUser(row)));
    }
    if (grant === "refresh_token") {
      const header = req.headers.authorization;
      if (header) {
        // Refresh uses the refresh token; map it back through a signed token.
        const claimed = verifyJwt(String(body.refresh_token ?? ""));
        if (claimed?.sub) {
          const row = await findUserById(claimed.sub);
          if (row) return send(res, 200, issueSession(publicUser(row)));
        }
      }
      return send(res, 400, { message: "Invalid refresh token" });
    }
    return send(res, 400, { message: "unsupported grant" });
  }

  if (path === "/user" && req.method === "GET") {
    const ctx = authContext(req);
    if (!ctx.userId) return send(res, 401, { message: "invalid claim: missing sub claim" });
    const row = await findUserById(ctx.userId);
    if (!row) return send(res, 403, { message: "user not found" });
    return send(res, 200, publicUser(row));
  }

  if (path === "/user" && req.method === "PUT") {
    const ctx = authContext(req);
    if (!ctx.userId) return send(res, 401, { message: "invalid claim" });
    const row = await findUserById(ctx.userId);
    if (!row) return send(res, 403, { message: "user not found" });
    if (typeof body.password === "string") {
      credentials.set(String(row.email).toLowerCase(), body.password);
      saveCredentials();
    }
    if (body.data) {
      await pool.query("update auth.users set raw_user_meta_data = $1 where id = $2", [
        body.data,
        ctx.userId,
      ]);
    }
    const fresh = await findUserById(ctx.userId);
    return send(res, 200, publicUser(fresh));
  }

  if (path === "/logout" && req.method === "POST") {
    return send(res, 204, undefined);
  }

  return send(res, 404, { message: `auth route not implemented: ${path}` });
}

/* ---------------------------------------------------------------- Server --- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    });
    return res.end();
  }
  try {
    if (process.env.SHIM_LOG_REQUESTS === "1") {
      console.log("[shim]", req.method, url.pathname + url.search);
    }
    if (url.pathname.startsWith("/rest/v1/")) return await handleRest(req, res, url);
    if (url.pathname.startsWith("/auth/v1")) return await handleAuth(req, res, url);
    return send(res, 404, { message: "not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[shim]", req.method, url.pathname, message);
    return send(res, 400, {
      code: error?.code ?? "SHIM_ERROR",
      message,
      details: error?.detail ?? null,
      hint: error?.hint ?? null,
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[shim] Supabase-compatible shim on http://0.0.0.0:${PORT}`);
  console.log(`[shim] anon=${ANON_KEY} service=${SERVICE_ROLE_KEY}`);
});
