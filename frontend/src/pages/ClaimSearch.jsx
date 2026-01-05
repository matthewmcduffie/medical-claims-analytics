import { useEffect, useState } from "react";

const PAGE_SIZE = 50;

function ClaimSearch() {
  const [rows, setRows] = useState([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(null);

  /* Search filters */
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    payer_type: "",
    payer_plan: "",
    cpt: "",
    appeal_eligible: "",
    min_allowed: "",
    max_allowed: "",
    min_paid: "",
    max_paid: "",
    min_missing: "",
    max_missing: ""
  });

  /* Sorting */
  const [sortBy, setSortBy] = useState("service_date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, sortBy, sortDir]);

  const loadData = () => {
    const params = new URLSearchParams({
      limit: PAGE_SIZE,
      offset,
      sort_by: sortBy,
      sort_dir: sortDir
    });

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    fetch(`http://localhost:3002/api/claims/search?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(setRows)
      .catch(() => setError("Failed to load claims."));
  };

  const updateFilter = (field, value) => {
    setOffset(0);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setOffset(0);
    loadData();
  };

  const resetFilters = () => {
    setOffset(0);
    setFilters({
      start_date: "",
      end_date: "",
      payer_type: "",
      payer_plan: "",
      cpt: "",
      appeal_eligible: "",
      min_allowed: "",
      max_allowed: "",
      min_paid: "",
      max_paid: "",
      min_missing: "",
      max_missing: ""
    });
    loadData();
  };

  const formatCurrency = (value) => {
    const number = Number(value);
    if (Number.isNaN(number)) return "$0";

    return number.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  };

  return (
    <div className="page-card">
      <h1>Claim Search</h1>

      <p>
        Use the filters below to locate individual claims by date, payer,
        procedure, dollar ranges, or appeal status. Filters may be combined
        freely to support targeted review.
      </p>

      {/* Search Form */}
      <div className="filter-bar">
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => updateFilter("start_date", e.target.value)}
          placeholder="Start date"
        />

        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => updateFilter("end_date", e.target.value)}
          placeholder="End date"
        />

        <select
          value={filters.payer_type}
          onChange={(e) => updateFilter("payer_type", e.target.value)}
        >
          <option value="">All Payers</option>
          <option value="Medicare">Medicare</option>
          <option value="Medicaid">Medicaid</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="text"
          placeholder="Payer plan"
          value={filters.payer_plan}
          onChange={(e) => updateFilter("payer_plan", e.target.value)}
        />

        <input
          type="text"
          placeholder="CPT / HCPCS"
          value={filters.cpt}
          onChange={(e) => updateFilter("cpt", e.target.value)}
        />

        <select
          value={filters.appeal_eligible}
          onChange={(e) => updateFilter("appeal_eligible", e.target.value)}
        >
          <option value="">Appeal eligible?</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        <input
          type="number"
          placeholder="Min allowed"
          value={filters.min_allowed}
          onChange={(e) => updateFilter("min_allowed", e.target.value)}
        />

        <input
          type="number"
          placeholder="Max allowed"
          value={filters.max_allowed}
          onChange={(e) => updateFilter("max_allowed", e.target.value)}
        />

        <input
          type="number"
          placeholder="Min paid"
          value={filters.min_paid}
          onChange={(e) => updateFilter("min_paid", e.target.value)}
        />

        <input
          type="number"
          placeholder="Max paid"
          value={filters.max_paid}
          onChange={(e) => updateFilter("max_paid", e.target.value)}
        />

        <input
          type="number"
          placeholder="Min missing"
          value={filters.min_missing}
          onChange={(e) => updateFilter("min_missing", e.target.value)}
        />

        <input
          type="number"
          placeholder="Max missing"
          value={filters.max_missing}
          onChange={(e) => updateFilter("max_missing", e.target.value)}
        />

        <button onClick={applyFilters}>Search</button>
        <button onClick={resetFilters}>Reset</button>
      </div>

      {error && <p style={{ color: "darkred" }}>{error}</p>}

      {/* Results Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Claim ID</th>
            <th>Payer</th>
            <th>Plan</th>
            <th className="numeric">Allowed</th>
            <th className="numeric">Paid</th>
            <th className="numeric">Missing</th>
            <th>Service Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.claim_id}>
              <td>{row.claim_id}</td>
              <td>{row.payer_type}</td>
              <td>{row.payer_plan}</td>
              <td className="numeric">{formatCurrency(row.allowed_amount)}</td>
              <td className="numeric">{formatCurrency(row.paid_amount)}</td>
              <td className="numeric">{formatCurrency(row.missing_amount)}</td>
              <td>{formatDate(row.service_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="filter-bar">
        <button
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
        >
          Previous
        </button>

        <button onClick={() => setOffset(offset + PAGE_SIZE)}>
          Next
        </button>
      </div>
    </div>
  );
}

export default ClaimSearch;
