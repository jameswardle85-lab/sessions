import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import SwimPage from "./SwimPage";
import GymPage from "./GymPage";
import SummaryPage from "./SummaryPage";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        {/* Navigation */}
        <nav className="bg-gray-900 text-white px-6 py-4 flex gap-4">
		  <Link className="hover:underline" to="/summary">Summary</Link>
          <Link className="hover:underline" to="/swim">Swim</Link>
          <Link className="hover:underline" to="/gym">Gym</Link>
        </nav>

        {/* Page content */}
        <main className="p-6">
          <Routes>
            <Route path="/swim" element={<SwimPage />} />
            <Route path="/gym" element={<GymPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="*" element={<SwimPage />} /> {/* Default route */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
