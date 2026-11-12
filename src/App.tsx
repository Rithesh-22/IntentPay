/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssistantPage } from './pages/AssistantPage';
import { ComparePage } from './pages/ComparePage';
import { PoliciesPage } from './pages/PoliciesPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AuditPage } from './pages/AuditPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[#111310] text-[#F0F0E9]">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/approve/:id" element={<ApprovalPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
