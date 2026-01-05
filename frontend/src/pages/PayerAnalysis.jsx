import { useEffect, useState } from "react";

function PayerAnalysis() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3002/api/breakdown/payer")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setRows)
      .catch(() => setError("Failed to load payer analysis data."));
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
   * Aggregate missing revenue by payer type
   */
  const totalsByPayer = rows.reduce((acc, row) => {
    const amount = Number(row.missing_amount) || 0;

    if (!acc[row.payer_type]) {
      acc[row.payer_type] = 0;
    }

    acc[row.payer_type] += amount;
    return acc;
  }, {});

  /**
   * Total missing revenue across all payers
   */
  const totalMissing = Object.values(totalsByPayer).reduce(
    (sum, val) => sum + val,
    0
  );

  /**
   * Format percentage of total
   */
  const formatPercent = (value) => {
    if (!totalMissing || Number.isNaN(value)) return "0%";
    return `${((value / totalMissing) * 100).toFixed(1)}%`;
  };

  return (
    <div className="page-card">
      <h1>Payer Analysis</h1>

      <p>
        This view examines payment discrepancies by payer type and payer plan,
        highlighting behavioral differences that drive underpayments and denials
        across Medicare, Medicaid, and commercial payers.
      </p>

      {error && <p style={{ color: "darkred" }}>{error}</p>}

      {!rows.length && !error && <p>Loading payer analysis…</p>}

      {rows.length > 0 && (
        <>
          <h2>Missing Revenue by Payer Type</h2>

          <div className="summary-grid">
            {Object.entries(totalsByPayer).map(([payer, amount]) => (
              <div key={payer} className="summary-card">
                <h3>{payer}</h3>
                <div className="value">{formatCurrency(amount)}</div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "0.85rem",
                    color: "#6b7280"
                  }}
                >
                  {formatPercent(amount)} of total
                </div>
              </div>
            ))}
          </div>

          <div className="section-divider" />

          <h2>Payer Plan Detail</h2>

          <table className="data-table">
            <thead>
              <tr>
                <th>Payer Type</th>
                <th>Payer Plan</th>
                <th className="numeric">Claims</th>
                <th className="numeric">Missing Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.payer_type}</td>
                  <td>{row.payer_plan}</td>
                  <td className="numeric">{row.claim_count}</td>
                  <td className="numeric">
                    {formatCurrency(row.missing_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="section-divider" />

          <h2>Interpretation</h2>

          <p>
            Differences across payer types often reflect a combination of fee
            schedules, documentation requirements, and administrative behavior.
            Higher missing revenue does not always indicate improper payment, but
            it clearly identifies where operational review and appeal workflows
            are most likely to produce results.
          </p>
        </>
      )}
    </div>
  );
}

export default PayerAnalysis;
