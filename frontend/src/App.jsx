import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Summary from "./pages/Summary";
import PayerAnalysis from "./pages/PayerAnalysis";
import CptAnalysis from "./pages/CptAnalysis";
import ClaimSearch from "./pages/ClaimSearch";
import RecoveryOpportunities from "./pages/RecoveryOpportunities";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/payer-analysis" element={<PayerAnalysis />} />
        <Route path="/cpt-analysis" element={<CptAnalysis />} />
        <Route path="/claim-search" element={<ClaimSearch />} />
        <Route path="/recovery-opportunities" element={<RecoveryOpportunities />} />
      </Routes>
    </Layout>
  );
}

export default App;
