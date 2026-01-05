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
 * Helper: safely parse numeric query params
 */
function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

/**
 * Build WHERE clause with optional filters
 * Appeal eligibility is DERIVED, not read from column
 */
function buildFilters(query, params) {
  const conditions = [];

  /* Date range */
  if (query.start_date) {
    conditions.push("service_date >= ?");
    params.push(query.start_date);
  }

  if (query.end_date) {
    conditions.push("service_date <= ?");
    params.push(query.end_date);
  }

  /* Exact / fuzzy matches */
  if (query.payer_type) {
    conditions.push("payer_type = ?");
    params.push(query.payer_type);
  }

  if (query.payer_plan) {
    conditions.push("payer_plan LIKE ?");
    params.push(`%${query.payer_plan}%`);
  }

  if (query.cpt) {
    conditions.push("cpt_hcpcs_code = ?");
    params.push(query.cpt);
  }

  /**
   * DERIVED appeal eligibility
   * Yes:
   *   paid < allowed AND denial_reason != 'Timely Filing'
   * No:
   *   paid < allowed AND denial_reason = 'Timely Filing'
   */
  if (query.appeal_eligible === "Yes") {
    conditions.push(`
      paid_amount < allowed_amount
      AND (denial_reason IS NULL OR denial_reason <> 'Timely Filing')
    `);
  }

  if (query.appeal_eligible === "No") {
    conditions.push(`
      paid_amount < allowed_amount
      AND denial_reason = 'Timely Filing'
    `);
  }

  /* Numeric ranges */
  const minAllowed = toNumberOrNull(query.min_allowed);
  const maxAllowed = toNumberOrNull(query.max_allowed);
  const minPaid = toNumberOrNull(query.min_paid);
  const maxPaid = toNumberOrNull(query.max_paid);
  const minMissing = toNumberOrNull(query.min_missing);
  const maxMissing = toNumberOrNull(query.max_missing);

  if (minAllowed !== null) {
    conditions.push("allowed_amount >= ?");
    params.push(minAllowed);
  }

  if (maxAllowed !== null) {
    conditions.push("allowed_amount <= ?");
    params.push(maxAllowed);
  }

  if (minPaid !== null) {
    conditions.push("paid_amount >= ?");
    params.push(minPaid);
  }

  if (maxPaid !== null) {
    conditions.push("paid_amount <= ?");
    params.push(maxPaid);
  }

  if (minMissing !== null) {
    conditions.push("(allowed_amount - paid_amount) >= ?");
    params.push(minMissing);
  }

  if (maxMissing !== null) {
    conditions.push("(allowed_amount - paid_amount) <= ?");
    params.push(maxMissing);
  }

  return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
}

/**
 * Build WHERE clause with mandatory base condition
 */
function buildWhereWithBase(query, params, baseCondition) {
  const conditions = [baseCondition];

  const extraWhere = buildFilters(query, params);
  if (extraWhere) {
    conditions.push(extraWhere.replace(/^WHERE /, ""));
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
 * Summary: recoverable vs non-recoverable (derived)
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
      CASE
        WHEN denial_reason = 'Timely Filing' THEN 'No'
        ELSE 'Yes'
      END AS appeal_eligible,
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
 * Raw claim search
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
