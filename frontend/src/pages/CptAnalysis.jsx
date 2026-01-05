import { useEffect, useState } from "react";

function CptAnalysis() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3002/api/breakdown/cpt")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setRows)
      .catch(() => setError("Failed to load CPT analysis data."));
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
   * Total missing revenue across all CPTs
   */
  const totalMissing = rows.reduce(
    (sum, row) => sum + (Number(row.missing_amount) || 0),
    0
  );

  /**
   * Percentage helper
   */
  const formatPercent = (value) => {
    if (!totalMissing || Number.isNaN(value)) return "0%";
    return `${((value / totalMissing) * 100).toFixed(1)}%`;
  };

  /**
   * Top CPTs by missing revenue (top 4)
   */
  const topCpts = rows.slice(0, 4);

  return (
    <div className="page-card">
      <h1>CPT Analysis</h1>

      <p>
        This view identifies procedure level patterns in payment discrepancies,
        highlighting CPT codes that consistently contribute to missing or
        underpaid revenue. These patterns often indicate operational issues,
        payer behavior, or documentation sensitivity.
      </p>

      {error && <p style={{ color: "darkred" }}>{error}</p>}

      {!rows.length && !error && <p>Loading CPT analysis…</p>}

      {rows.length > 0 && (
        <>
          <h2>Top CPT Codes by Missing Revenue</h2>

          <div className="summary-grid">
            {topCpts.map((row) => {
              const amount = Number(row.missing_amount) || 0;

              return (
                <div key={row.cpt_hcpcs_code} className="summary-card">
                  <h3>{row.cpt_hcpcs_code}</h3>
                  <div className="value">{formatCurrency(amount)}</div>
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "0.85rem",
                      color: "#6b7280"
                    }}
                  >
                    {formatPercent(amount)} of total CPT leakage
                  </div>
                </div>
              );
            })}
          </div>

          <div className="section-divider" />

          <h2>CPT Detail</h2>

          <table className="data-table">
            <thead>
              <tr>
                <th>CPT / HCPCS</th>
                <th className="numeric">Claims</th>
                <th className="numeric">Missing Revenue</th>
                <th className="numeric">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const amount = Number(row.missing_amount) || 0;

                return (
                  <tr key={idx}>
                    <td>{row.cpt_hcpcs_code}</td>
                    <td className="numeric">{row.claim_count}</td>
                    <td className="numeric">
                      {formatCurrency(amount)}
                    </td>
                    <td className="numeric">
                      {formatPercent(amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="section-divider" />

          <h2>Interpretation</h2>

          <p>
            CPT level concentration of missing revenue often reveals where payer
            policies, documentation requirements, or reimbursement rules create
            consistent friction. High dollar impact CPTs with repeat volume are
            typically the most effective targets for focused review and appeal
            strategies.
          </p>
        </>
      )}
    </div>
  );
}

export default CptAnalysis;
