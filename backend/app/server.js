const Fastify = require("fastify");
const pool = require("./db");

const fastify = Fastify({ logger: true });

fastify.register(require("@fastify/cors"), {
  origin: "http://localhost:5173"
});

const ALLOWED_SORT_FIELDS = [
  "service_date",
  "allowed_amount",
  "paid_amount",
  "missing_amount"
];

/**
 * Helper: build WHERE clause with optional filters
 * Used when NO base condition is required
 */
function buildFilters(query, params) {
  const conditions = [];

  if (query.start_date) {
    conditions.push("service_date >= ?");
    params.push(query.start_date);
  }

  if (query.end_date) {
    conditions.push("service_date <= ?");
    params.push(query.end_date);
  }

  if (query.payer_type) {
    conditions.push("payer_type = ?");
    params.push(query.payer_type);
  }

  if (query.payer_plan) {
    conditions.push("payer_plan = ?");
    params.push(query.payer_plan);
  }

  if (query.cpt) {
    conditions.push("cpt_hcpcs_code = ?");
    params.push(query.cpt);
  }

  if (query.appeal_eligible) {
    conditions.push("appeal_eligible = ?");
    params.push(query.appeal_eligible);
  }

  return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
}

/**
 * Helper: build WHERE clause WITH a required base condition
 * Prevents invalid SQL when no filters are provided
 */
function buildWhereWithBase(query, params, baseCondition) {
  const conditions = [baseCondition];

  if (query.start_date) {
    conditions.push("service_date >= ?");
    params.push(query.start_date);
  }

  if (query.end_date) {
    conditions.push("service_date <= ?");
    params.push(query.end_date);
  }

  if (query.payer_type) {
    conditions.push("payer_type = ?");
    params.push(query.payer_type);
  }

  if (query.payer_plan) {
    conditions.push("payer_plan = ?");
    params.push(query.payer_plan);
  }

  if (query.cpt) {
    conditions.push("cpt_hcpcs_code = ?");
    params.push(query.cpt);
  }

  if (query.appeal_eligible) {
    conditions.push("appeal_eligible = ?");
    params.push(query.appeal_eligible);
  }

  return `WHERE ${conditions.join(" AND ")}`;
}

/**
 * Health check
 */
fastify.get("/health", async () => ({ status: "ok" }));

/**
 * Summary: billed vs allowed vs paid vs missing
 */
fastify.get("/api/summary/missing-money", async (request) => {
  const params = [];
  const whereClause = buildFilters(request.query, params);

  const [rows] = await pool.query(
    `
    SELECT
      SUM(billed_amount) AS total_billed,
      SUM(allowed_amount) AS total_allowed,
      SUM(paid_amount) AS total_paid,
      SUM(allowed_amount - paid_amount) AS total_missing
    FROM claims
    ${whereClause}
    `,
    params
  );

  return rows[0];
});

/**
 * Summary: recoverable vs non-recoverable
 */
fastify.get("/api/summary/recoverable", async (request) => {
  const params = [];
  const whereClause = buildWhereWithBase(
    request.query,
    params,
    "paid_amount < allowed_amount"
  );

  const [rows] = await pool.query(
    `
    SELECT
      appeal_eligible,
      COUNT(*) AS claim_count,
      SUM(allowed_amount - paid_amount) AS missing_amount
    FROM claims
    ${whereClause}
    GROUP BY appeal_eligible
    `,
    params
  );

  return rows;
});

/**
 * Breakdown: payer
 */
fastify.get("/api/breakdown/payer", async (request) => {
  const params = [];
  const whereClause = buildWhereWithBase(
    request.query,
    params,
    "paid_amount < allowed_amount"
  );

  const [rows] = await pool.query(
    `
    SELECT
      payer_type,
      payer_plan,
      COUNT(*) AS claim_count,
      SUM(allowed_amount - paid_amount) AS missing_amount
    FROM claims
    ${whereClause}
    GROUP BY payer_type, payer_plan
    ORDER BY missing_amount DESC
    `,
    params
  );

  return rows;
});

/**
 * Breakdown: CPT
 */
fastify.get("/api/breakdown/cpt", async (request) => {
  const params = [];
  const whereClause = buildWhereWithBase(
    request.query,
    params,
    "paid_amount < allowed_amount"
  );

  const [rows] = await pool.query(
    `
    SELECT
      cpt_hcpcs_code,
      COUNT(*) AS claim_count,
      SUM(allowed_amount - paid_amount) AS missing_amount
    FROM claims
    ${whereClause}
    GROUP BY cpt_hcpcs_code
    ORDER BY missing_amount DESC
    `,
    params
  );

  return rows;
});

/**
 * Time series: missing money by month
 */
fastify.get("/api/timeseries/missing-money", async (request) => {
  const params = [];
  const whereClause = buildWhereWithBase(
    request.query,
    params,
    "paid_amount < allowed_amount"
  );

  const [rows] = await pool.query(
    `
    SELECT
      DATE_FORMAT(service_date, '%Y-%m') AS period,
      SUM(allowed_amount - paid_amount) AS missing_amount
    FROM claims
    ${whereClause}
    GROUP BY period
    ORDER BY period
    `,
    params
  );

  return rows;
});

/**
 * Raw claim search with pagination and sorting
 */
fastify.get("/api/claims/search", async (request) => {
  const params = [];
  const whereClause = buildFilters(request.query, params);

  const limit = Math.min(Number(request.query.limit) || 50, 500);
  const offset = Number(request.query.offset) || 0;

  let sortBy = request.query.sort_by || "service_date";
  let sortDir = request.query.sort_dir === "asc" ? "ASC" : "DESC";

  if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
    sortBy = "service_date";
  }

  const [rows] = await pool.query(
    `
    SELECT
      *,
      (allowed_amount - paid_amount) AS missing_amount
    FROM claims
    ${whereClause}
    ORDER BY ${sortBy} ${sortDir}
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  );

  return rows;
});

/**
 * Start server
 */
const start = async () => {
  try {
    await fastify.listen({
      port: process.env.API_PORT || 3002,
      host: "0.0.0.0"
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
