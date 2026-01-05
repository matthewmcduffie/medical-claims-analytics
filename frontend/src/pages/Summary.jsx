import { useEffect, useState } from "react";

function Summary() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3002/api/summary/missing-money")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(setSummary)
      .catch((err) => {
        console.error(err);
        setError("Failed to load summary data.");
      });
  }, []);

  const formatCurrency = (value) =>
    value?.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }) || "$0";

  return (
    <div className="page-card">
      <h1>Revenue Summary</h1>

      {error && <p style={{ color: "darkred" }}>{error}</p>}

      {!summary && !error && <p>Loading summary data…</p>}

      {summary && (
        <div className="summary-grid">
          <div className="summary-card">
            <h3>Total Billed</h3>
            <div className="value">{formatCurrency(summary.total_billed)}</div>
          </div>

          <div className="summary-card">
            <h3>Total Allowed</h3>
            <div className="value">{formatCurrency(summary.total_allowed)}</div>
          </div>

          <div className="summary-card">
            <h3>Total Paid</h3>
            <div className="value">{formatCurrency(summary.total_paid)}</div>
          </div>

          <div className="summary-card missing">
            <h3>Total Missing</h3>
            <div className="value">{formatCurrency(summary.total_missing)}</div>
          </div>
        </div>
      )}

      <p>
        This view provides a high level snapshot of billed, allowed, and paid
        amounts across the entire dataset, highlighting the total dollar value
        of payment discrepancies.
      </p>
    </div>
  );
}

export default Summary;
