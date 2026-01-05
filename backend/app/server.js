const Fastify = require("fastify");
const pool = require("./db");

const fastify = Fastify({
  logger: true
});

/**
 * Health check
 */
fastify.get("/health", async () => {
  return { status: "ok" };
});

/**
 * Missing money summary
 */
fastify.get("/api/summary/missing-money", async () => {
  const [rows] = await pool.query(`
    SELECT
      SUM(allowed_amount) AS total_allowed,
      SUM(paid_amount) AS total_paid,
      SUM(allowed_amount - paid_amount) AS total_missing
    FROM claims
    WHERE paid_amount < allowed_amount
  `);

  return rows[0];
});

/**
 * Recoverable vs non-recoverable loss
 */
fastify.get("/api/summary/recoverable", async () => {
  const [rows] = await pool.query(`
    SELECT
      appeal_eligible,
      SUM(allowed_amount - paid_amount) AS missing_amount
    FROM claims
    WHERE paid_amount < allowed_amount
    GROUP BY appeal_eligible
  `);

  return rows;
});

/**
 * Missing money by payer
 */
fastify.get("/api/breakdown/payer", async () => {
  const [rows] = await pool.query(`
    SELECT
      payer_type,
      payer_plan,
      COUNT(*) AS claim_count,
      SUM(allowed_amount - paid_amount) AS missing_amount
    FROM claims
    WHERE paid_amount < allowed_amount
    GROUP BY payer_type, payer_plan
    ORDER BY missing_amount DESC
  `);

  return rows;
});

/**
 * Missing money by CPT
 */
fastify.get("/api/breakdown/cpt", async () => {
  const [rows] = await pool.query(`
    SELECT
      cpt_hcpcs_code,
      COUNT(*) AS claim_count,
      SUM(allowed_amount - paid_amount) AS missing_amount
    FROM claims
    WHERE paid_amount < allowed_amount
    GROUP BY cpt_hcpcs_code
    ORDER BY missing_amount DESC
  `);

  return rows;
});

/**
 * Claim search
 */
fastify.get("/api/claims/search", async (request) => {
  const {
    claim_id,
    payer_type,
    cpt,
    appeal_eligible,
    limit = 50
  } = request.query;

  const conditions = [];
  const params = [];

  if (claim_id) {
    conditions.push("claim_id = ?");
    params.push(claim_id);
  }

  if (payer_type) {
    conditions.push("payer_type = ?");
    params.push(payer_type);
  }

  if (cpt) {
    conditions.push("cpt_hcpcs_code = ?");
    params.push(cpt);
  }

  if (appeal_eligible) {
    conditions.push("appeal_eligible = ?");
    params.push(appeal_eligible);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const [rows] = await pool.query(
    `
    SELECT *
    FROM claims
    ${whereClause}
    ORDER BY service_date DESC
    LIMIT ?
    `,
    [...params, Number(limit)]
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
