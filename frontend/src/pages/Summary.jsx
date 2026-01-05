import { useEffect, useState } from "react";

function Summary() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3002/api/summary/missing-money")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setSummary)
      .catch(() => setError("Failed to load summary data."));
  }, []);

  /**
   * Format currency safely from MariaDB DECIMAL strings
   */
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "$0";

    const number = Number(value);
    if (Number.isNaN(number)) return "$0";

    return number.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  /**
   * Format percentage with one decimal
   */
  const formatPercent = (numerator, denominator) => {
    if (!denominator || Number.isNaN(numerator)) return "0%";
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  return (
    <div className="page-card">
      <h1>Revenue Summary</h1>

      <p>
        This overview highlights the relationship between billed, allowed, and
        paid amounts across the dataset, surfacing the total financial impact
        of underpayments and denials.
      </p>

      {error && <p style={{ color: "darkred" }}>{error}</p>}

      {!summary && !error && <p>Loading summary data…</p>}

      {summary && (
        <div className="summary-grid">
          <div className="summary-card">
            <h3>Total Billed</h3>
            <div className="value">
              {formatCurrency(summary.total_billed)}
            </div>
          </div>

          <div className="summary-card">
            <h3>Total Allowed</h3>
            <div className="value">
              {formatCurrency(summary.total_allowed)}
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "0.85rem",
                color: "#6b7280"
              }}
            >
              {formatPercent(
                Number(summary.total_allowed),
                Number(summary.total_billed)
              )}{" "}
              of billed
            </div>
          </div>

          <div className="summary-card">
            <h3>Total Paid</h3>
            <div className="value">
              {formatCurrency(summary.total_paid)}
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "0.85rem",
                color: "#6b7280"
              }}
            >
              {formatPercent(
                Number(summary.total_paid),
                Number(summary.total_allowed)
              )}{" "}
              of allowed
            </div>
          </div>

          <div className="summary-card missing">
            <h3>Total Missing</h3>
            <div className="value">
              {formatCurrency(summary.total_missing)}
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "0.85rem",
                color: "#6b7280"
              }}
            >
              {formatPercent(
                Number(summary.total_missing),
                Number(summary.total_allowed)
              )}{" "}
              of allowed
            </div>
          </div>
        </div>
      )}

      <div className="section-divider" />

      <h2>How to Read This</h2>

      <p>
        Billed amounts represent provider charges, while allowed amounts reflect
        payer contractual adjustments. The gap between allowed and paid highlights
        payment discrepancies that may represent recoverable revenue or true
        write offs depending on appeal eligibility.
      </p>
    </div>
  );
}

export default Summary;
