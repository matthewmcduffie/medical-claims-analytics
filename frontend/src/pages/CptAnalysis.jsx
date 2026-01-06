import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/*
  Lightweight, explainable CPT categorization.
  This is intentionally pragmatic, not a full CPT taxonomy.
*/
const CPT_CATEGORY_MAP = {
  "99213": "E/M",
  "99214": "E/M",
  "93000": "Diagnostics",
  "71046": "Diagnostics",
  "94640": "Respiratory / DME",
  "94010": "Respiratory / DME",
  "94760": "Respiratory / DME",
  "36415": "Lab",
  "80053": "Lab",
  "85025": "Lab",
  "A7030": "Respiratory / DME",
  "A7037": "Respiratory / DME",
  "E0601": "Respiratory / DME",
  "E0470": "Respiratory / DME",
  "E1390": "Respiratory / DME"
};

const getCategory = (cpt) =>
  CPT_CATEGORY_MAP[cpt] || "Other";

/*
  Conservative behavioral heuristics.
  These mirror how real analysts think about patterns.
*/
const isHighVolume = (count) => count >= 50;
const isHighAvgLoss = (avg) => avg >= 100;
const isSystemic = (count, avg) =>
  count >= 20 && avg >= 50;

const interpretCpt = (row) => {
  const avg =
    row.missing_amount / row.claim_count;

  if (isSystemic(row.claim_count, avg)) {
    return "Likely systemic underpayment or payer policy behavior.";
  }

  if (isHighAvgLoss(avg)) {
    return "High per-claim variance; review contract pricing or bundling rules.";
  }

  if (isHighVolume(row.claim_count)) {
    return "High frequency service; documentation consistency is critical.";
  }

  return "Lower impact; review as time permits.";
};

function CptAnalysis() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3002/api/breakdown/cpt")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setRows)
      .catch(() =>
        setError("Failed to load CPT analysis data.")
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

  return (
    <div className="page-card">
      <h1>CPT Analysis</h1>

      <p>
        This analysis evaluates payment discrepancies by procedure code to
        identify services that consistently underperform relative to allowed
        amounts. CPT-level patterns often point to documentation gaps,
        payer-specific policy interpretation, or contractual variance.
      </p>

      {error && <p style={{ color: "darkred" }}>{error}</p>}
      {!rows.length && !error && <p>Loading CPT analysis…</p>}

      {rows.length > 0 && (
        <>
          <h2>Highest Impact Procedures</h2>

          <p className="section-explainer">
            A small subset of procedures typically drives a disproportionate
            share of missing revenue. These services represent the most
            efficient starting point for review.
          </p>

          <div className="summary-grid">
            {rows.slice(0, 4).map((row) => (
              <div
                key={row.cpt_hcpcs_code}
                className="summary-card"
              >
                <h3>{row.cpt_hcpcs_code}</h3>
                <div className="value">
                  {formatCurrency(row.missing_amount)}
                </div>
                <p className="summary-subtext">
                  {percent(
                    row.missing_amount,
                    totalMissing
                  )}% of total missing revenue
                </p>
              </div>
            ))}
          </div>

          <div className="section-divider" />

          <h2>How to Read CPT-Level Loss</h2>

          <ul>
            <li>
              <strong>High volume + moderate loss:</strong> Often indicates
              documentation inconsistency or workflow variation.
            </li>
            <li>
              <strong>Low volume + high loss:</strong> Frequently reflects
              contract pricing, bundling rules, or payer reductions.
            </li>
            <li>
              <strong>Consistent underpayment:</strong> Suggests systemic
              payer behavior rather than isolated claim error.
            </li>
          </ul>

          <div className="section-divider" />

          <h2>Procedure Detail</h2>

          <p className="section-explainer">
            Rows are clickable. Selecting a procedure drills into the
            underlying claims so documentation, modifiers, and payer
            response patterns can be reviewed directly.
          </p>

          <table className="data-table data-table-hover">
            <thead>
              <tr>
                <th>CPT / HCPCS</th>
                <th>Category</th>
                <th className="numeric">Claims</th>
                <th className="numeric">Total Missing</th>
                <th className="numeric">Avg / Claim</th>
                <th>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const avg =
                  row.missing_amount / row.claim_count;

                return (
                  <tr
                    key={row.cpt_hcpcs_code}
                    className="clickable-row"
                    onClick={() =>
                      navigate(
                        `/claim-search?cpt=${encodeURIComponent(
                          row.cpt_hcpcs_code
                        )}`
                      )
                    }
                  >
                    <td>{row.cpt_hcpcs_code}</td>
                    <td>{getCategory(row.cpt_hcpcs_code)}</td>
                    <td className="numeric">
                      {row.claim_count}
                    </td>
                    <td className="numeric">
                      {formatCurrency(
                        row.missing_amount
                      )}
                    </td>
                    <td className="numeric">
                      {formatCurrency(avg)}
                    </td>
                    <td className="insight-cell">
                      {interpretCpt(row)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="section-divider" />

          <h2>Recommended Next Steps</h2>

          <p>
            CPTs showing consistent loss should be evaluated for documentation
            sufficiency, modifier usage, and payer-specific policy requirements.
            Focus first where financial impact and claim volume intersect.
          </p>
        </>
      )}
    </div>
  );
}

export default CptAnalysis;
