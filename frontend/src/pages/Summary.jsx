import { useEffect, useState } from "react";

function Summary() {
  const [summary, setSummary] = useState(null);
  const [recoverable, setRecoverable] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3002/api/summary/missing-money").then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch("http://localhost:3002/api/summary/recoverable").then((r) =>
        r.ok ? r.json() : Promise.reject()
      )
    ])
      .then(([summaryData, recoverableData]) => {
        setSummary(summaryData);
        setRecoverable(recoverableData);
      })
      .catch(() => setError("Failed to load summary data."));
  }, []);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });

  const percent = (part, total) =>
    total > 0 ? ((part / total) * 100).toFixed(1) : "0.0";

  if (error) {
    return (
      <div className="page-card">
        <h1>Revenue Summary</h1>
        <p style={{ color: "darkred" }}>{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="page-card">
        <h1>Revenue Summary</h1>
        <p>Loading summary data…</p>
      </div>
    );
  }

  const totalMissing = Number(summary.total_missing || 0);
  const totalAllowed = Number(summary.total_allowed || 0);
  const totalBilled = Number(summary.total_billed || 0);

  const recoverableYes = recoverable.find((r) => r.appeal_eligible === "Yes");
  const recoverableNo = recoverable.find((r) => r.appeal_eligible === "No");

  const recoverableAmount = recoverableYes
    ? Number(recoverableYes.missing_amount)
    : 0;

  const nonRecoverableAmount = recoverableNo
    ? Number(recoverableNo.missing_amount)
    : 0;

  return (
    <div className="page-card">
      <h1>Revenue Summary</h1>

      <p>
        This summary provides a high level view of billed, allowed, and paid
        amounts across the dataset, with emphasis on identifying payment
        discrepancies that may represent recoverable revenue.
      </p>

      {/* Core metrics */}
      <div className="summary-grid">
        <div className="summary-card">
          <h3>Total Billed</h3>
          <div className="value">{formatCurrency(totalBilled)}</div>
        </div>

        <div className="summary-card">
          <h3>Total Allowed</h3>
          <div className="value">{formatCurrency(totalAllowed)}</div>
        </div>

        <div className="summary-card">
          <h3>Total Paid</h3>
          <div className="value">{formatCurrency(summary.total_paid)}</div>
        </div>

        <div className="summary-card missing">
          <h3>Total Missing</h3>
          <div className="value">{formatCurrency(totalMissing)}</div>
          <p className="subtext">
            {percent(totalMissing, totalAllowed)}% of allowed
          </p>
        </div>
      </div>

      <div className="section-divider" />

      {/* Key insights */}
      <h2>Key Observations</h2>

      <ul className="tool-list">
        <li>
          Missing revenue represents{" "}
          <strong>{percent(totalMissing, totalAllowed)}%</strong> of total
          allowed amounts, indicating measurable payment friction beyond
          contractual adjustments.
        </li>

        <li>
          Approximately{" "}
          <strong>
            {percent(recoverableAmount, totalMissing)}%
          </strong>{" "}
          of missing revenue appears potentially appeal eligible based on denial
          behavior and payment status.
        </li>

        <li>
          The remaining{" "}
          <strong>
            {percent(nonRecoverableAmount, totalMissing)}%
          </strong>{" "}
          is associated with structurally unrecoverable scenarios such as timely
          filing denials.
        </li>
      </ul>

      <div className="section-divider" />

      {/* Guidance */}
      <h2>Recommended Areas for Review</h2>

      <p>
        Payment discrepancies are not evenly distributed. Subsequent analysis
        should focus on payer segments and procedure codes that account for a
        disproportionate share of missing revenue, particularly where appeal
        eligibility is high.
      </p>

      <p>
        Patterns observed here provide direction for deeper review in the Payer,
        CPT, and Claim Search views, where individual behaviors and root causes
        can be examined in detail.
      </p>

      <div className="section-divider" />

      {/* Scope */}
      <h2>Data Scope & Assumptions</h2>

      <p>
        This analysis reflects adjudicated claims only. Appeal eligibility is
        derived from payment status and denial reason rather than explicit flags.
        Dollar amounts represent contractual underpayments and denials, not gross
        provider charges.
      </p>
    </div>
  );
}

export default Summary;
