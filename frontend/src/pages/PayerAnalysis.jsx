import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PayerAnalysis() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3002/api/breakdown/payer")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setRows)
      .catch(() =>
        setError("Failed to load payer analysis data.")
      );
  }, []);

  const formatCurrency = (value) =>
    Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    });

  const totalMissing = rows.reduce(
    (sum, r) => sum + Number(r.missing_amount || 0),
    0
  );

  const percent = (part, total) =>
    total > 0 ? ((part / total) * 100).toFixed(1) : "0.0";

  /* Simple payer-level confidence heuristic */
  const payerConfidence = (payer) => {
    if (payer === "Medicare") return "High";
    if (payer === "Medicaid") return "Medium";
    return "Medium";
  };

  const confidenceClass = (level) =>
    `confidence ${level.toLowerCase()}`;

  /* Group totals by payer */
  const totalsByPayer = rows.reduce((acc, row) => {
    if (!acc[row.payer_type]) {
      acc[row.payer_type] = {
        total: 0,
        plans: []
      };
    }
    acc[row.payer_type].total += Number(row.missing_amount);
    acc[row.payer_type].plans.push(row);
    return acc;
  }, {});

  return (
    <div className="page-card">
      <h1>Payer Analysis</h1>

      <p>
        This analysis examines payment discrepancies by payer and plan to
        highlight systemic reimbursement behavior, administrative friction,
        and potential recovery patterns.
      </p>

      {error && <p style={{ color: "darkred" }}>{error}</p>}
      {!rows.length && !error && <p>Loading payer analysis…</p>}

      {rows.length > 0 && (
        <>
          {/* High-level summary */}
          <h2>Missing Revenue by Payer Type</h2>

          <p className="section-explainer">
            Disproportionate loss by payer often reflects contract structure,
            documentation requirements, or adjudication behavior rather than
            isolated claim errors.
          </p>

          <div className="summary-grid">
            {Object.entries(totalsByPayer).map(([payer, data]) => (
              <div key={payer} className="summary-card">
                <h3>{payer}</h3>
                <div className="value">
                  {formatCurrency(data.total)}
                </div>
                <p className="summary-subtext">
                  {percent(data.total, totalMissing)}% of total missing
                </p>
                <span className={confidenceClass(payerConfidence(payer))}>
                  {payerConfidence(payer)} Confidence
                </span>
              </div>
            ))}
          </div>

          <div className="section-divider" />

          {/* Behavioral guidance */}
          <h2>Common Payer Behaviors</h2>

          <p className="section-explainer">
            The patterns below are commonly observed across billing operations
            and should be validated against individual contract terms and
            payer policies.
          </p>

          <ul>
            <li>
              <strong>Medicare:</strong> Loss is often driven by medical
              necessity determinations, documentation sufficiency, or
              coverage policy interpretation.
            </li>
            <li>
              <strong>Medicaid:</strong> Administrative denials, eligibility
              gaps, and timely filing issues frequently contribute to loss.
            </li>
            <li>
              <strong>Commercial:</strong> Underpayments and contract variance
              are common, particularly across plans and network tiers.
            </li>
          </ul>

          <div className="section-divider" />

          {/* Detail table */}
          <h2>Payer Plan Detail</h2>

          <p className="section-explainer">
            Click any row to review the underlying claims for that payer and
            plan combination.
          </p>

          <table className="data-table data-table-hover">
            <thead>
              <tr>
                <th>Payer Type</th>
                <th>Payer Plan</th>
                <th className="numeric">Claims</th>
                <th className="numeric">Missing Revenue</th>
                <th className="numeric">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() =>
                    navigate(
                      `/claim-search?payer_type=${encodeURIComponent(
                        row.payer_type
                      )}&payer_plan=${encodeURIComponent(
                        row.payer_plan
                      )}`
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>{row.payer_type}</td>
                  <td>{row.payer_plan}</td>
                  <td className="numeric">{row.claim_count}</td>
                  <td className="numeric">
                    {formatCurrency(row.missing_amount)}
                  </td>
                  <td className="numeric">
                    {percent(row.missing_amount, totalMissing)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-divider" />

          {/* How to use */}
          <h2>How to Use This Analysis</h2>

          <p>
            Focus investigation on payer-plan combinations with consistent loss
            across claim volume. Validate whether issues stem from policy,
            documentation, or operational execution before pursuing appeal
            strategies.
          </p>
        </>
      )}
    </div>
  );
}

export default PayerAnalysis;
