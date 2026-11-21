import { BookOpen, CheckCircle2, Database, Layers, Shield, Users } from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { AVATARS, CAMPUS_IMAGE_URL } from '../data/seedData';
import { UserAvatar } from './VehicleIcon';

export function ProjectOverviewView() {
  const { slots, zones, setActiveTab, resetDemoData } = useParking();

  return (
    <div className="space-y-6">
      {/* Campus Architectural Banner */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[260px] flex items-end">
        <img
          src={CAMPUS_IMAGE_URL}
          alt="Madhav Institute of Technology and Science, Gwalior Campus Parking"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-950/10" />
        <div className="relative z-10 p-6 sm:p-8 max-w-3xl space-y-2">
          <p className="text-xs font-medium text-blue-200">
            First-Year B.Tech CSBS Project · Madhav Institute of Technology &amp; Science, Gwalior
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
            MITS Smart Parking Management System
          </h2>
          <p className="text-sm text-slate-200 leading-relaxed">
            A component-based campus parking web application engineered by{' '}
            <strong className="text-white">Team NeonDrive</strong> to streamline bay discovery,
            role-based reservations, registration lookups, and occupancy reporting across MITS
            Gwalior.
          </p>
        </div>
      </section>

      {/* Team NeonDrive Credits */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Users className="w-4 h-4 text-blue-700" />
            <h3 className="font-display font-semibold text-base">Team NeonDrive</h3>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-3.5 flex items-center gap-3.5">
              <UserAvatar name="Shubham Khare" avatarUrl={AVATARS.student} size="lg" />
              <div>
                <p className="font-display font-semibold text-sm text-slate-900">Shubham Khare</p>
                <p className="text-xs text-slate-600">
                  B.Tech CSBS (1st Year) · MITS Gwalior
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Campus Map Architecture, Smart Reservation Flow &amp; UI Systems
                </p>
              </div>
            </div>

            <div className="py-3.5 flex items-center gap-3.5">
              <UserAvatar name="Sohit Patel" avatarUrl={AVATARS.admin} size="lg" />
              <div>
                <p className="font-display font-semibold text-sm text-slate-900">Sohit Patel</p>
                <p className="text-xs text-slate-600">
                  B.Tech CSBS (1st Year) · MITS Gwalior
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  State Persistence, Role-Based Admin Controls &amp; Occupancy Analytics
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transparent Prototype Architecture Note */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Database className="w-4 h-4 text-blue-700" />
            <h3 className="font-display font-semibold text-base">
              Demo Architecture &amp; Data Transparency
            </h3>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            This application is a functional frontend prototype engineered with{' '}
            <strong>React, TypeScript, Tailwind CSS, Lucide Icons, and Recharts</strong>. All slot
            reservations, check-ins, vehicle additions, and admin overrides persist locally in your
            browser (<code className="font-mono text-xs text-slate-800">localStorage</code>) so the
            demo remains interactive across page reloads without external credentials.
          </p>

          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Honest Scope:</strong> Uses realistic MITS Gwalior demo data across{' '}
                {zones.length} zones and {slots.length} clickable slots — makes zero false claims of
                live IoT ultrasonic sensors, CCTV feeds, or GPS tracking.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Backend-Ready Model:</strong> Context actions map cleanly to relational
                tables (zones, slots, users, vehicles, reservations, history) for future Supabase or
                PostgreSQL integration.
              </span>
            </li>
          </ul>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800"
            >
              Open Campus Map
            </button>
            <button
              type="button"
              onClick={resetDemoData}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset Demo State
            </button>
          </div>
        </div>
      </section>

      {/* Core Modules Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <Layers className="w-5 h-5 text-blue-700" />
          <h4 className="font-display font-semibold text-sm text-slate-900">
            01. Interactive Campus Site Plan
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Visualizes Zones A through E across MITS Gwalior with vehicle-type filtering and direct
            bay selection.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <Shield className="w-5 h-5 text-blue-700" />
          <h4 className="font-display font-semibold text-sm text-slate-900">
            02. Role-Based Dashboards
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Distinct workflows for Students, Faculty/Staff (priority Zone A access), and Campus
            Administrators (overrides, capacity expansion, CSV export).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
          <BookOpen className="w-5 h-5 text-blue-700" />
          <h4 className="font-display font-semibold text-sm text-slate-900">
            03. Smart Finder &amp; Analytics
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Recommends closest available bays by academic block, supports instant MP 07 plate
            lookups, and renders live-updating Recharts occupancy analytics.
          </p>
        </div>
      </section>
    </div>
  );
}
