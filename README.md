# Medical Claims Analytics Platform

This project is a full-stack medical claims analytics application built to analyze payment discrepancies, denial behavior, and recoverable revenue in healthcare billing data.

The purpose of this project is to demonstrate applied data analysis skills in a real-world healthcare context. The focus is not only on visualization, but on how data is structured, queried, interpreted, and ultimately translated into outputs that non-technical stakeholders can act on.

Rather than treating analytics as a collection of charts, this system is designed as an end-to-end analysis workflow, from raw claims data to executive-ready reporting.

🌐 **Live Application:** [https://mca.thelastpatch.com/](https://mca.thelastpatch.com/)

---

## Project Overview

The application analyzes adjudicated medical claims data to identify:

- Underpayments and partial payments
- Denial patterns and common denial drivers
- Payer and payer-plan behavior
- CPT-level trends associated with revenue loss
- Potentially recoverable versus structurally unrecoverable revenue

In addition to interactive dashboards, the platform generates a single-page executive PDF summary report directly from live data. This report demonstrates how analytical findings can be communicated clearly and professionally to practice administrators and billing leadership.

---

## Why This Project Exists

In many healthcare organizations, large volumes of billing data exist but are underutilized. Revenue leakage often occurs not because data is unavailable, but because it is difficult to explore, filter, and interpret efficiently.

This project was built to highlight how a data analyst can:

- Model and structure claims data for meaningful analysis
- Identify patterns beyond surface-level totals
- Build tools that allow flexible exploration without technical barriers
- Translate analytical findings into operational guidance

Throughout the project, the emphasis is on clarity, credibility, and usability rather than visual complexity.

---

## Technical Highlights

- Backend API built with Fastify (Node.js)
- MariaDB database with structured claims data
- React frontend using Material UI for a clean, dashboard-style interface
- Aggregations and breakdowns by payer, plan, CPT, time period, and claim attributes
- On-demand executive PDF reporting generated from live database queries
- Stateless architecture where new or corrected data is immediately reflected across all views

All analytics pages and reports are driven directly from the database, ensuring consistency between interactive exploration and exported results.

---

## Installation

### Requirements

- Node.js version 18 or newer
- MariaDB or MySQL-compatible database
- npm or yarn package manager

### Local Setup

1. Clone the repository:

       git clone <repository-url>
       cd medical-claims-analytics

2. Install backend dependencies:

       cd backend
       npm install

3. Configure the database connection:

   - Create a MariaDB database
   - Set environment variables for database host, user, password, and database name

4. Start the backend API:

       node server.js

5. Install and start the frontend:

       cd frontend
       npm install
       npm run dev

---

## License

This project is released under the MIT License.

Copyright © 2026 Matthew McDuffie
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction, provided that the above copyright notice and this permission notice are included in all copies or substantial portions of the Software.
