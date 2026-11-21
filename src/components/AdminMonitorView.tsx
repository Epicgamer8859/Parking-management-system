import React, { useMemo, useState } from 'react';
import {
  Download,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { ROLE_LABELS, VEHICLE_TYPE_LABELS } from '../data/seedData';
import { UserRole, VehicleType } from '../types/parking';
import { getStatusMeta } from './VehicleIcon';

export function AdminMonitorView() {
  const {
    currentUser,
    zones,
    slots,
    loginAsUser,
    adminUpdateSlotStatus,
    adminAddSlot,
    adminRemoveSlot,
    checkOutSlot,
    resetDemoData,
    jumpToSlotOnMap,
    showToast,
  } = useParking();

  // Manual gate entry state
  const [entrySlotId, setEntrySlotId] = useState<string>('');
  const [entryReg, setEntryReg] = useState<string>('');
  const [entryDriver, setEntryDriver] = useState<string>('');
  const [entryRole, setEntryRole] = useState<UserRole>('student');
  const [entryDept, setEntryDept] = useState<string>('CSBS');

  // Expand zone capacity state
  const [newSlotZoneId, setNewSlotZoneId] = useState<string>('zone-academic');
  const [newSlotType, setNewSlotType] = useState<VehicleType>('two-wheeler');

  // Filter table
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const availableSlots = useMemo(
    () => slots.filter((s) => s.status === 'available'),
    [slots]
  );

  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      if (zoneFilter !== 'all' && s.zoneId !== zoneFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [slots, zoneFilter, statusFilter]);

  // Role gate for Student / Faculty with 1-click Demo Admin Switch for presentations
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <section className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Admin Monitoring Requires Admin Role
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            You are currently viewing the app as{' '}
            <strong>
              {currentUser ? `${currentUser.name} (${ROLE_LABELS[currentUser.role]})` : 'Guest'}
            </strong>
            . Role-based access restricts slot overrides, capacity changes, and gate logs to Campus
            Administrators.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => loginAsUser('user-sohit')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Switch to Admin Demo (Sohit Patel)
          </button>
        </div>
      </section>
    );
  }

  const handleManualGateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = entrySlotId || availableSlots[0]?.id;
    if (!targetId) {
      showToast('No available slots left to assign.', 'error');
      return;
    }
    if (!entryReg.trim()) {
      showToast('Enter a vehicle registration number.', 'error');
      return;
    }
    adminUpdateSlotStatus(targetId, 'occupied', {
      vehicleReg: entryReg,
      occupantName: entryDriver || 'Gate Walk-in',
      occupantRole: entryRole,
      department: entryDept,
      vehicleModel: 'Manual Gate Log',
    });
    setEntryReg('');
    setEntryDriver('');
    setEntrySlotId('');
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const allowed: UserRole[] =
      newSlotZoneId === 'zone-admin' ? ['faculty', 'admin'] : ['student', 'faculty', 'admin'];
    adminAddSlot(newSlotZoneId, newSlotType, allowed);
  };

  const handleExportCsv = () => {
    const header = [
      'Slot ID',
      'Zone',
      'Vehicle Type',
      'Status',
      'Registration Number',
      'Driver',
      'Role',
      'Department',
      'Since',
    ];
    const rows = slots.map((s) => {
      const zone = zones.find((z) => z.id === s.zoneId);
      return [
        s.id,
        zone?.name ?? s.zoneId,
        VEHICLE_TYPE_LABELS[s.vehicleType],
        s.status,
        s.vehicleReg ?? '',
        s.occupantName ?? '',
        s.occupantRole ?? '',
        s.department ?? '',
        s.since ?? '',
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mits-gwalior-parking-report.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded CSV parking report', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Admin Top Utility Strip */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Campus Parking Operations Console
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Signed in as Admin ({currentUser.name}) · Manage gate entries, bay maintenance, and zone
            capacity
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV Report
          </button>
          <button
            type="button"
            onClick={resetDemoData}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50 text-xs font-medium text-rose-700 hover:bg-rose-100 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Dataset
          </button>
        </div>
      </section>

      {/* Operational Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Gate Entry Form */}
        <form
          onSubmit={handleManualGateEntry}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div>
            <h3 className="font-display font-semibold text-base text-slate-900">
              Log Manual Gate Entry
            </h3>
            <p className="text-xs text-slate-500">
              Assign a walk-in vehicle at the MITS Main Gate directly to an open parking bay.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Available Bay</span>
              <select
                value={entrySlotId || availableSlots[0]?.id || ''}
                onChange={(e) => setEntrySlotId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 bg-white"
              >
                {availableSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} ({VEHICLE_TYPE_LABELS[s.vehicleType].split(' ')[0]})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-700">Registration Number</span>
              <input
                type="text"
                required
                value={entryReg}
                onChange={(e) => setEntryReg(e.target.value)}
                placeholder="MP 07 AB 9921"
                className="mt-1 w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-200"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-700">Driver Name</span>
              <input
                type="text"
                value={entryDriver}
                onChange={(e) => setEntryDriver(e.target.value)}
                placeholder="e.g. Rohan Sharma"
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Role</span>
                <select
                  value={entryRole}
                  onChange={(e) => setEntryRole(e.target.value as UserRole)}
                  className="mt-1 w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Dept</span>
                <input
                  type="text"
                  value={entryDept}
                  onChange={(e) => setEntryDept(e.target.value)}
                  className="mt-1 w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200"
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Assign Bay &amp; Mark Occupied
          </button>
        </form>

        {/* Expand Campus Capacity Form */}
        <form
          onSubmit={handleAddSlot}
          className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-semibold text-base text-slate-900">
                Add Parking Slot to Zone
              </h3>
              <p className="text-xs text-slate-500">
                Dynamically expand bay count for campus events, fests, or exam days.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Target Campus Zone</span>
                <select
                  value={newSlotZoneId}
                  onChange={(e) => setNewSlotZoneId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.code} — {z.shortName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">Bay Vehicle Type</span>
                <select
                  value={newSlotType}
                  onChange={(e) => setNewSlotType(e.target.value as VehicleType)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                >
                  {(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map((vt) => (
                    <option key={vt} value={vt}>
                      {VEHICLE_TYPE_LABELS[vt]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Parking Bay
          </button>
        </form>
      </div>

      {/* All-Campus Slot Management Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-base text-slate-900">
              All Campus Parking Slots ({filteredSlots.length})
            </h3>
            <p className="text-xs text-slate-500">
              Toggle maintenance, release occupied bays, or remove unused overflow slots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              aria-label="Filter by zone"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="all">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.code} · {z.shortName}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr className="text-xs font-medium text-slate-500">
                <th className="py-3 px-4">Bay</th>
                <th className="py-3 px-4">Zone &amp; Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Current Vehicle / Occupant</th>
                <th className="py-3 px-4 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSlots.map((slot) => {
                const zone = zones.find((z) => z.id === slot.zoneId);
                const meta = getStatusMeta(slot.status);
                return (
                  <tr key={slot.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono text-xs font-semibold text-slate-900">
                      <button
                        type="button"
                        onClick={() => jumpToSlotOnMap(slot.id)}
                        className="text-blue-700 hover:underline"
                      >
                        {slot.id}
                      </button>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="text-xs font-medium text-slate-800">
                        {zone?.code} · {zone?.shortName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {VEHICLE_TYPE_LABELS[slot.vehicleType]}
                      </p>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-xs font-semibold ${meta.textColor}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {slot.vehicleReg ? (
                        <>
                          <p className="font-mono text-xs font-medium text-slate-900">
                            {slot.vehicleReg}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {slot.occupantName} · {slot.since ?? 'Today'}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {slot.notes || '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {(slot.status === 'occupied' || slot.status === 'reserved') && (
                          <button
                            type="button"
                            onClick={() => checkOutSlot(slot.id)}
                            className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Release
                          </button>
                        )}
                        {slot.status !== 'maintenance' ? (
                          <button
                            type="button"
                            onClick={() => adminUpdateSlotStatus(slot.id, 'maintenance')}
                            title="Set maintenance"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            <Wrench className="w-3 h-3" />
                            Maint
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => adminUpdateSlotStatus(slot.id, 'available')}
                            className="px-2.5 py-1 rounded-md bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800"
                          >
                            Reopen
                          </button>
                        )}
                        {slot.status === 'available' && (
                          <button
                            type="button"
                            onClick={() => adminRemoveSlot(slot.id)}
                            aria-label={`Remove slot ${slot.id}`}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
