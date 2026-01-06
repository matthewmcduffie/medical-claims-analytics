const Fastify = require("fastify");
const pool = require("./db");
const PDFDocument = require("pdfkit");

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

/* ============================================================
   Utilities
============================================================ */

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

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

  /* Text filters */
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

  /* Derived appeal eligibility */
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

function buildWhereWithBase(query, params, baseCondition) {
  const conditions = [baseCondition];
  const extra = buildFilters(query, params);
  if (extra) conditions.push(extra.replace(/^WHERE /, ""));
  return `WHERE ${conditions.join(" AND ")}`;
}

/* ============================================================
   Health
============================================================ */

fastify.get("/health", async () => ({ status: "ok" }));

/* ============================================================
   Summary APIs
============================================================ */

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

/* ============================================================
   Breakdown APIs
============================================================ */

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

/* ============================================================
   Time Series
============================================================ */

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

/* ============================================================
   Claim Search
============================================================ */

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

/* ============================================================
   Executive PDF Report (single-page, styled)
============================================================ */

fastify.get("/api/reports/summary-pdf", (request, reply) => {
  reply.hijack();

  reply.raw.setHeader("Content-Type", "application/pdf");
  reply.raw.setHeader(
    "Content-Disposition",
    "inline; filename=Revenue_Integrity_Summary.pdf"
  );

  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 50, left: 50, right: 50, bottom: 50 }
  });

  doc.pipe(reply.raw);

  (async () => {
    try {
      const [[summary]] = await pool.query(`
        SELECT
          SUM(billed_amount) AS total_billed,
          SUM(allowed_amount) AS total_allowed,
          SUM(paid_amount) AS total_paid,
          SUM(allowed_amount - paid_amount) AS total_missing
        FROM claims
      `);

      const [recoverable] = await pool.query(`
        SELECT
          CASE
            WHEN denial_reason = 'Timely Filing' THEN 'No'
            ELSE 'Yes'
          END AS appeal_eligible,
          SUM(allowed_amount - paid_amount) AS missing_amount
        FROM claims
        WHERE paid_amount < allowed_amount
        GROUP BY appeal_eligible
      `);

      const recoverableYes =
        recoverable.find((r) => r.appeal_eligible === "Yes")?.missing_amount ||
        0;

      const percent = (p, t) => (t > 0 ? ((p / t) * 100).toFixed(1) : "0.0");

      const formatMoney = (v) =>
        `$${Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

      const steelBlue = "#3b5c7e";
      const borderGray = "#d1d5db";
      const textGray = "#374151";

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 100;

      /* Header */
      doc.rect(0, 0, pageWidth, 80).fill(steelBlue);
      doc.fillColor("white").fontSize(20).text("Revenue Integrity Summary", 50, 28);
      doc
        .fontSize(10)
        .text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - 200, 34);

      /* Content border */
      doc.fillColor("black").rect(50, 100, contentWidth, 620).stroke(borderGray);

      /* Summary cards */
      const cardTop = 120;
      const cardHeight = 90;
      const gap = 12;
      const cardWidth = (contentWidth - gap * 3) / 4;

      [
        ["Billed", formatMoney(summary.total_billed)],
        ["Allowed", formatMoney(summary.total_allowed)],
        ["Paid", formatMoney(summary.total_paid)],
        ["Missing", formatMoney(summary.total_missing)]
      ].forEach(([label, value], i) => {
        const x = 50 + i * (cardWidth + gap);
        doc.rect(x, cardTop, cardWidth, cardHeight).stroke(borderGray);
        doc.fillColor(textGray).fontSize(10).text(label.toUpperCase(), x + 12, cardTop + 12);
        doc
          .fontSize(18)
          .fillColor(label === "Missing" ? "#8b0000" : "black")
          .text(value, x + 12, cardTop + 36);
      });

      let y = cardTop + cardHeight + 40;

      doc.fillColor("black").fontSize(14).text("Key Findings", 70, y);

      y += 20;
      doc.fontSize(11).fillColor(textGray).list(
        [
          `Missing revenue represents ${percent(
            summary.total_missing,
            summary.total_allowed
          )}% of allowed amounts.`,
          `${percent(recoverableYes, summary.total_missing)}% appears potentially appeal-eligible.`,
          "Loss is concentrated within a limited subset of claims."
        ],
        { bulletIndent: 12 }
      );

      y += 120;
      doc.fillColor("black").fontSize(14).text("Recommended Actions", 70, y);

      y += 20;
      doc.fontSize(11).fillColor(textGray).list(
        [
          "Prioritize appeal of high-dollar underpayments.",
          "Address timely filing workflow gaps.",
          "Standardize documentation for high-risk services.",
          "Monitor payer behavior on a recurring basis."
        ],
        { bulletIndent: 12 }
      );

      doc.fontSize(9).fillColor("#6b7280").text(
        "Scope: Adjudicated claims only. Appeal eligibility inferred from payment behavior and denial reason. Figures represent contractual discrepancies.",
        70,
        680,
        { width: contentWidth - 40 }
      );
    } catch (err) {
      console.error("PDF generation error:", err);
      reply.raw.destroy(err);
    } finally {
      doc.end();
    }
  })();
});

/* ============================================================
   Recovery Opportunities (Ranked + Confidence)
============================================================ */

fastify.get("/api/opportunities/ranked", async (request) => {
  const limit = Math.min(Number(request.query.limit) || 50, 100);
  const offset = Number(request.query.offset) || 0;

  const [rows] = await pool.query(
    `
    SELECT
      payer_type,
      payer_plan,
      cpt_hcpcs_code,
      COUNT(*) AS claim_count,
      SUM(allowed_amount - paid_amount) AS total_missing_amount,
      AVG(allowed_amount - paid_amount) AS avg_missing_per_claim,
      ROUND(
        100 * SUM(
          CASE
            WHEN denial_reason IS NULL OR denial_reason <> 'Timely Filing'
            THEN 1 ELSE 0
          END
        ) / COUNT(*),
        1
      ) AS appeal_eligible_rate
    FROM claims
    WHERE paid_amount < allowed_amount
    GROUP BY payer_type, payer_plan, cpt_hcpcs_code
    HAVING claim_count >= 5
    ORDER BY total_missing_amount DESC
    LIMIT ? OFFSET ?
    `,
    [limit, offset]
  );

  const scored = rows.map((row) => {
    const appealRate = Number(row.appeal_eligible_rate) || 0;
    const avgMissing = Number(row.avg_missing_per_claim) || 0;
    const claimCount = Number(row.claim_count) || 0;

    const appealScore = appealRate * 0.5; // 0..50
    const avgScore = Math.min(avgMissing / 10, 30); // capped at 30
    const volumeScore = Math.min(claimCount / 5, 20); // capped at 20

    const score = Math.round(appealScore + avgScore + volumeScore);

    let bucket = "Low";
    if (score >= 70) bucket = "High";
    else if (score >= 40) bucket = "Medium";

    return {
      ...row,
      confidence_score: score,
      confidence_bucket: bucket
    };
  });

  return scored;
});

/* ============================================================
   Start server
============================================================ */

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
