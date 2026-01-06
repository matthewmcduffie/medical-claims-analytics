import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Summary() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3002/api/summary/missing-money")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setSummary)
      .catch(() => setError("Failed to load summary data."));
  }, []);

  const formatCurrency = (value) =>
    Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });

  const percent = (part, total) =>
    total > 0 ? ((part / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="page-card">
      <h1>Revenue Summary</h1>

      <p>
        This overview summarizes billing outcomes across all analyzed claims,
        highlighting the relationship between billed, allowed, and paid amounts
        and the resulting financial exposure.
      </p>

      {error && <p style={{ color: "darkred" }}>{error}</p>}
      {!summary && !error && <p>Loading summary data…</p>}

      {summary && (
        <>
          {/* Summary Metrics */}
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
            </div>

            <div className="summary-card">
              <h3>Total Paid</h3>
              <div className="value">
                {formatCurrency(summary.total_paid)}
              </div>
            </div>

            <div className="summary-card missing">
              <h3>Total Missing</h3>
              <div className="value">
                {formatCurrency(summary.total_missing)}
              </div>
              <p className="summary-subtext">
                {percent(
                  summary.total_missing,
                  summary.total_allowed
                )}% of allowed
              </p>
            </div>
          </div>

          {/* Interpretation */}
          <h2>What This Tells You</h2>
          <p>
            The gap between allowed and paid amounts represents adjudicated
            revenue that was not fully reimbursed. This includes both denials
            and underpayments. While not all missing revenue is recoverable,
            concentration within specific payers, procedures, and patterns
            often indicates actionable improvement opportunities.
          </p>

          {/* Guided Navigation */}
          <h2>Where to Focus Next</h2>

          <div className="guidance-grid">
            <div
              className="guidance-card"
              onClick={() => navigate("/recovery-opportunities")}
            >
              <h3>Recovery Opportunities</h3>
              <p>
                Identify payer and procedure combinations with the highest
                recovery potential, ranked by impact and confidence.
              </p>
            </div>

            <div
              className="guidance-card"
              onClick={() => navigate("/payer-analysis")}
            >
              <h3>Payer Analysis</h3>
              <p>
                Examine how reimbursement behavior differs across Medicare,
                Medicaid, and commercial payers.
              </p>
            </div>

            <div
              className="guidance-card"
              onClick={() => navigate("/claim-search")}
            >
              <h3>Claim-Level Review</h3>
              <p>
                Search and filter individual claims to validate findings,
                investigate root causes, and support appeals.
              </p>
            </div>
          </div>

          {/* Confidence tie-in */}
          <p className="confidence-explainer">
            Subsequent analyses apply confidence scoring to distinguish
            high-likelihood recovery opportunities from structural write-offs,
            helping prioritize effort where it matters most.
          </p>
        </>
      )}
    </div>
  );
}

export default Summary;
