function Home() {
  return (
    <div className="page-card">
      <h1>Medical Claims Revenue Integrity Analytics</h1>

      <p>
        This project demonstrates a practical, production minded approach to
        identifying missing and recoverable revenue in healthcare billing data.
        Rather than focusing on raw claim ingestion or payer specific quirks,
        the emphasis here is on building durable analytical tooling that exposes
        where money is lost, why it is lost, and whether it can be recovered.
      </p>

      <p>
        The dataset backing this application simulates real world Medicare,
        Medicaid, and commercial payer behavior, including underpayments,
        silent denials, administrative write offs, and appeal eligible revenue.
        All data is fully de identified, structurally consistent, and designed
        to support repeatable analysis rather than one off reporting.
      </p>

      <h2>Project Goals</h2>

      <p>
        The primary goal of this project is to demonstrate the ability to design
        and implement an end to end analytics platform that mirrors how internal
        revenue integrity tools are built and used in practice.
      </p>

      <ul className="tool-list">
        <li>Identify underpaid and denied claims that are not immediately obvious</li>
        <li>Quantify financial impact by payer, procedure, and time period</li>
        <li>Separate recoverable revenue from true write offs</li>
        <li>Present findings clearly without requiring stakeholders to hunt</li>
      </ul>

      <h2>Technical Approach</h2>

      <p>
        The backend API is backed by a relational database hosted remotely and
        exposed through read only analytical endpoints. The frontend consumes
        these endpoints directly, allowing filters, aggregation, and trend
        analysis to scale as additional data is introduced.
      </p>

      <ul className="tool-list">
        <li>MariaDB for structured analytical storage</li>
        <li>Fastify based API with parameterized filtering</li>
        <li>React and Material UI for a clean, professional interface</li>
        <li>Deterministic data generation to support repeatable results</li>
      </ul>

      <p>
        As additional pages are added, this dashboard will expand to include
        payer specific leakage analysis, CPT level trends, time series views,
        and detailed claim level exploration.
      </p>
    </div>
  );
}

export default Home;
