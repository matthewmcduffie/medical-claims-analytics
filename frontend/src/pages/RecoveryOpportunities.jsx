import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function RecoveryOpportunities() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3002/api/opportunities/ranked")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setRows)
      .catch(() =>
        setError("Failed to load recovery opportunities.")
      );
  }, []);

  const formatCurrency = (value) =>
    Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });

  const handleRowClick = (row) => {
    navigate(
      `/claim-search?payer_type=${encodeURIComponent(
        row.payer_type
      )}&payer_plan=${encodeURIComponent(
        row.payer_plan
      )}&cpt=${encodeURIComponent(
        row.cpt_hcpcs_code
      )}`
    );
  };

  const highConfidenceRows = rows.filter(
    (r) => r.confidence_bucket === "High"
  );

  const immediateWins = highConfidenceRows.slice(0, 3);

  const displayedRows = highConfidenceOnly
    ? highConfidenceRows
    : rows;

  return (
    <div className="page-card">
      <h1>Recovery Opportunities</h1>

      <p>
        Opportunities are ranked by financial impact and recovery confidence.
        Click any row to drill into the underlying claims and begin targeted
        review.
      </p>

      {/* Confidence explanation */}
      <p className="confidence-explainer">
        Confidence reflects appeal eligibility, average dollars at risk, and
        claim volume. Higher confidence indicates a stronger likelihood of
        successful recovery.
      </p>

      {/* Immediate Wins */}
      {immediateWins.length > 0 && (
        <>
          <h2>Immediate Wins</h2>
          <p className="section-hint">
            These high-confidence opportunities represent the most actionable
            recovery targets based on the current data.
          </p>

          <div className="summary-grid">
            {immediateWins.map((row) => (
              <div
                key={`${row.payer_type}-${row.payer_plan}-${row.cpt_hcpcs_code}`}
                className="summary-card"
                onClick={() => handleRowClick(row)}
                style={{ cursor: "pointer" }}
              >
                <h3>
                  {row.payer_type} · {row.cpt_hcpcs_code}
                </h3>
                <div className="value">
                  {formatCurrency(row.total_missing_amount)}
                </div>
                <p style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                  {row.claim_count} claims · Avg{" "}
                  {formatCurrency(row.avg_missing_per_claim)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "12px 0 20px 0"
        }}
      >
        <input
          type="checkbox"
          id="high-confidence-toggle"
          checked={highConfidenceOnly}
          onChange={(e) => setHighConfidenceOnly(e.target.checked)}
        />
        <label htmlFor="high-confidence-toggle">
          Show high-confidence recovery opportunities only
        </label>
      </div>

      {error && <p style={{ color: "darkred" }}>{error}</p>}
      {!rows.length && !error && <p>Loading recovery opportunities…</p>}

      {displayedRows.length === 0 && rows.length > 0 && (
        <p style={{ color: "#6b7280", fontStyle: "italic" }}>
          No high-confidence opportunities found with the current data.
        </p>
      )}

      {displayedRows.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th className="numeric">Rank</th>
              <th>Payer</th>
              <th>Plan</th>
              <th>CPT</th>
              <th className="numeric">Claims</th>
              <th className="numeric">Total Missing</th>
              <th className="numeric">Avg / Claim</th>
              <th className="numeric">Confidence</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row, index) => (
              <tr
                key={`${row.payer_type}-${row.payer_plan}-${row.cpt_hcpcs_code}`}
                onClick={() => handleRowClick(row)}
                style={{ cursor: "pointer" }}
              >
                <td className="numeric">{index + 1}</td>
                <td>{row.payer_type}</td>
                <td>{row.payer_plan}</td>
                <td>{row.cpt_hcpcs_code}</td>
                <td className="numeric">{row.claim_count}</td>
                <td className="numeric">
                  {formatCurrency(row.total_missing_amount)}
                </td>
                <td className="numeric">
                  {formatCurrency(row.avg_missing_per_claim)}
                </td>
                <td className="numeric">{row.confidence_score}</td>
                <td>
                  <span
                    className={`confidence ${row.confidence_bucket.toLowerCase()}`}
                  >
                    {row.confidence_bucket}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RecoveryOpportunities;
