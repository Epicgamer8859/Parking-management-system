/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AdminMonitorView } from './components/AdminMonitorView';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthModal } from './components/AuthModal';
import { CampusMapView } from './components/CampusMapView';
import { ProfileVehiclesView } from './components/ProfileVehiclesView';
import { ProjectOverviewView } from './components/ProjectOverviewView';
import { Sidebar } from './components/Sidebar';
import { SmartReserveView } from './components/SmartReserveView';
import { TopBar } from './components/TopBar';
import { VehicleLookupView } from './components/VehicleLookupView';
import { ParkingProvider, useParking } from './context/ParkingContext';

function ParkingWorkspace() {
  const { activeTab, toast } = useParking();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'map' && <CampusMapView />}
          {activeTab === 'reserve' && <SmartReserveView />}
          {activeTab === 'lookup' && <VehicleLookupView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'admin' && <AdminMonitorView />}
          {activeTab === 'profile' && <ProfileVehiclesView />}
          {activeTab === 'project' && <ProjectOverviewView />}
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-3.5 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            MITS Smart Parking Management System · Madhav Institute of Technology &amp; Science,
            Gwalior
          </span>
          <span>Team NeonDrive — Shubham Khare &amp; Sohit Patel (B.Tech CSBS)</span>
        </footer>
      </div>

      <AuthModal />

      {/* Transient Feedback Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.tone === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : toast.tone === 'error'
                ? 'bg-rose-700 text-white border-rose-800'
                : 'bg-white text-slate-900 border-slate-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ParkingProvider>
      <ParkingWorkspace />
    </ParkingProvider>
  );
}
