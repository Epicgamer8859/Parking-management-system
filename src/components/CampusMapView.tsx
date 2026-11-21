import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Lock,
  LogOut,
  MapPin,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { ROLE_LABELS, VEHICLE_TYPE_LABELS } from '../data/seedData';
import { ParkingSlot, VehicleType } from '../types/parking';
import { getStatusMeta, VehicleIcon } from './VehicleIcon';

type VehicleFilter = 'all' | VehicleType;

export function CampusMapView() {
  const {
    zones,
    slots,
    reservations,
    currentUser,
    selectedZoneId,
    setSelectedZoneId,
    selectedSlotId,
    setSelectedSlotId,
    reserveSlot,
    checkInReservation,
    checkOutSlot,
    cancelReservation,
    adminUpdateSlotStatus,
    setAuthModalOpen,
  } = useParking();

  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Reservation form state inside the slot inspector
  const [selectedVehicleReg, setSelectedVehicleReg] = useState<string>('');
  const [customReg, setCustomReg] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [reserveNotes, setReserveNotes] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const primary = currentUser?.vehicles.find((v) => v.isPrimary) ?? currentUser?.vehicles[0];
    setSelectedVehicleReg(primary?.regNumber ?? '');
    setActionError(null);
  }, [currentUser?.id, currentUser?.vehicles]);

  // Admin quick assign state
  const [adminRegInput, setAdminRegInput] = useState<string>('');
  const [adminNameInput, setAdminNameInput] = useState<string>('');

  const campusTotals = useMemo(() => {
    const total = slots.length;
    const available = slots.filter((s) => s.status === 'available').length;
    const occupied = slots.filter((s) => s.status === 'occupied').length;
    const reserved = slots.filter((s) => s.status === 'reserved').length;
    const maintenance = slots.filter((s) => s.status === 'maintenance').length;
    const occupancyPct = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;
    return { total, available, occupied, reserved, maintenance, occupancyPct };
  }, [slots]);

  const zoneStatsMap = useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        available: number;
        occupied: number;
        reserved: number;
        maintenance: number;
        matchingAvailable: number;
      }
    > = {};

    for (const z of zones) {
      const zSlots = slots.filter((s) => s.zoneId === z.id);
      const matchingAvailable = zSlots.filter(
        (s) =>
          s.status === 'available' &&
          (vehicleFilter === 'all' || s.vehicleType === vehicleFilter)
      ).length;

      map[z.id] = {
        total: zSlots.length,
        available: zSlots.filter((s) => s.status === 'available').length,
        occupied: zSlots.filter((s) => s.status === 'occupied').length,
        reserved: zSlots.filter((s) => s.status === 'reserved').length,
        maintenance: zSlots.filter((s) => s.status === 'maintenance').length,
        matchingAvailable,
      };
    }
    return map;
  }, [zones, slots, vehicleFilter]);

  const activeZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) ?? zones[0],
    [zones, selectedZoneId]
  );

  const activeZoneSlots = useMemo(() => {
    return slots.filter((s) => s.zoneId === activeZone.id);
  }, [slots, activeZone.id]);

  const rowASlots = useMemo(
    () => activeZoneSlots.filter((s) => s.row === 'A'),
    [activeZoneSlots]
  );
  const rowBSlots = useMemo(
    () => activeZoneSlots.filter((s) => s.row === 'B'),
    [activeZoneSlots]
  );

  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) ?? activeZoneSlots[0] ?? null,
    [slots, selectedSlotId, activeZoneSlots]
  );

  const selectedSlotReservation = useMemo(() => {
    if (!selectedSlot) return null;
    return (
      reservations.find(
        (r) =>
          r.slotId === selectedSlot.id &&
          (r.status === 'active' || r.status === 'checked-in')
      ) ?? null
    );
  }, [reservations, selectedSlot]);

  const isSlotHighlighted = (slot: ParkingSlot) => {
    const matchesVehicle = vehicleFilter === 'all' || slot.vehicleType === vehicleFilter;
    const matchesAvailability = !onlyAvailable || slot.status === 'available';
    return matchesVehicle && matchesAvailability;
  };

  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setActionError(null);
    const firstInZone = slots.find((s) => s.zoneId === zoneId);
    if (firstInZone) setSelectedSlotId(firstInZone.id);
  };

  const handleReserveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    const chosenVehicle =
      currentUser.vehicles.find((v) => v.regNumber === selectedVehicleReg) ??
      currentUser.vehicles.find((v) => v.type === selectedSlot.vehicleType) ??
      currentUser.vehicles[0];

    const regToUse = customReg.trim() || chosenVehicle?.regNumber || '';
    const modelToUse = customReg.trim()
      ? 'Custom Entered Vehicle'
      : chosenVehicle?.model || 'Registered Vehicle';

    const res = reserveSlot({
      slotId: selectedSlot.id,
      vehicleReg: regToUse,
      vehicleType: selectedSlot.vehicleType,
      vehicleModel: modelToUse,
      durationHours,
      notes: reserveNotes,
    });

    if (!res.ok) {
      setActionError(res.message);
      return;
    }
    setActionError(null);
    setReserveNotes('');
    setCustomReg('');
  };

  const handleAdminManualOccupy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    const res = adminUpdateSlotStatus(selectedSlot.id, 'occupied', {
      vehicleReg: adminRegInput || 'MP 07 GA 1024',
      occupantName: adminNameInput || 'Walk-in Campus Vehicle',
      occupantRole: 'student',
      department: 'Gate Log',
    });
    if (!res.ok) {
      setActionError(res.message);
      return;
    }
    setAdminRegInput('');
    setAdminNameInput('');
    setActionError(null);
  };

  const userCanReserveSlot =
    selectedSlot &&
    currentUser &&
    (currentUser.role === 'admin' || selectedSlot.allowedRoles.includes(currentUser.role));

  const userOwnsSelectedSlot =
    selectedSlot &&
    currentUser &&
    (selectedSlot.occupantId === currentUser.id ||
      selectedSlotReservation?.userId === currentUser.id);

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <section aria-label="Campus parking summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Total Campus Capacity</p>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-display text-2xl font-bold text-slate-900 tabular-nums">
              {campusTotals.total}
            </span>
            <span className="text-xs text-slate-500">5 Zones · MITS Gwalior</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Available Slots Now</p>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-display text-2xl font-bold text-emerald-700 tabular-nums">
              {campusTotals.available}
            </span>
            <span className="text-xs text-emerald-700 font-medium tabular-nums">
              {Math.round((campusTotals.available / Math.max(campusTotals.total, 1)) * 100)}% open
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Occupied Bays</p>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-display text-2xl font-bold text-rose-700 tabular-nums">
              {campusTotals.occupied}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {campusTotals.occupancyPct}% total utilization
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Reserved / Maintenance</p>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="font-display text-2xl font-bold text-amber-700 tabular-nums">
              {campusTotals.reserved}
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {campusTotals.maintenance} in maintenance
            </span>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section
        aria-label="Parking filters"
        className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Vehicle Type:
          </span>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              ['all', 'two-wheeler', 'car', 'ev', 'bicycle', 'accessible'] as VehicleFilter[]
            ).map((vt) => (
              <button
                key={vt}
                type="button"
                onClick={() => setVehicleFilter(vt)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  vehicleFilter === vt
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {vt === 'all' ? 'All Vehicles' : VEHICLE_TYPE_LABELS[vt].split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          />
          Highlight Available Only
        </label>
      </section>

      {/* Main Focal Workspace: Interactive Campus Map + Slot Grid + Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Architectural Campus Map + Clickable Zone Slot Grid */}
        <div className="xl:col-span-8 space-y-6">
          {/* Interactive Architectural MITS Gwalior Campus Map */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display font-semibold text-base text-slate-900">
                  MITS Gwalior Campus Site Plan
                </h2>
                <p className="text-xs text-slate-500">
                  Race Course Road, Gole Ka Mandir · Click any parking zone to inspect individual
                  bays
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  North ↑
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Active: <strong className="text-slate-800">{activeZone.code}</strong>
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/60">
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox="0 0 920 430"
                  className="w-full min-w-[660px] h-auto rounded-lg border border-slate-200 bg-[#F4F7FA]"
                  role="img"
                  aria-label="Interactive MITS Gwalior Campus Parking Map"
                >
                  {/* Campus Lawn & Grounds */}
                  <rect x="0" y="0" width="920" height="430" fill="#F4F7FA" />
                  <rect
                    x="18"
                    y="18"
                    width="884"
                    height="394"
                    rx="12"
                    fill="#F8FAFC"
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                  />

                  {/* Architectural Campus Buildings */}
                  <g>
                    {/* Main Administrative Building */}
                    <rect
                      x="46"
                      y="52"
                      width="220"
                      height="112"
                      rx="8"
                      fill="#E2E8F0"
                      stroke="#94A3B8"
                      strokeWidth="1.2"
                    />
                    <text
                      x="156"
                      y="102"
                      textAnchor="middle"
                      fill="#1E293B"
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      Main Administrative Block
                    </text>
                    <text
                      x="156"
                      y="122"
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="11"
                      fontFamily="DM Sans, sans-serif"
                    >
                      Director Office · Seminar Hall
                    </text>

                    {/* Central Lawn */}
                    <rect
                      x="60"
                      y="178"
                      width="192"
                      height="32"
                      rx="6"
                      fill="#DCFCE7"
                      stroke="#86EFAC"
                      strokeWidth="1"
                    />
                    <text
                      x="156"
                      y="198"
                      textAnchor="middle"
                      fill="#166534"
                      fontSize="10.5"
                      fontWeight="600"
                    >
                      Central Heritage Lawn
                    </text>

                    {/* CSBS / Academic Building Label Strip */}
                    <rect
                      x="318"
                      y="32"
                      width="256"
                      height="38"
                      rx="6"
                      fill="#E2E8F0"
                      stroke="#94A3B8"
                      strokeWidth="1"
                    />
                    <text
                      x="446"
                      y="55"
                      textAnchor="middle"
                      fill="#1E293B"
                      fontSize="12"
                      fontWeight="700"
                    >
                      CSBS · CSE · IT Academic Wing
                    </text>

                    {/* Workshop / Sports Strip */}
                    <rect
                      x="626"
                      y="32"
                      width="246"
                      height="38"
                      rx="6"
                      fill="#E2E8F0"
                      stroke="#94A3B8"
                      strokeWidth="1"
                    />
                    <text
                      x="749"
                      y="55"
                      textAnchor="middle"
                      fill="#1E293B"
                      fontSize="12"
                      fontWeight="700"
                    >
                      Mechanical Workshop &amp; Ground
                    </text>
                  </g>

                  {/* Campus Internal Roads */}
                  <g>
                    {/* Main Horizontal Avenue */}
                    <rect x="20" y="220" width="880" height="38" fill="#CBD5E1" />
                    <line
                      x1="34"
                      y1="239"
                      x2="886"
                      y2="239"
                      stroke="#F8FAFC"
                      strokeWidth="2"
                      strokeDasharray="12 10"
                    />
                    {/* Vertical Connectors */}
                    <rect x="278" y="24" width="28" height="384" fill="#CBD5E1" />
                    <rect x="586" y="24" width="28" height="384" fill="#CBD5E1" />
                    <line
                      x1="292"
                      y1="36"
                      x2="292"
                      y2="396"
                      stroke="#F8FAFC"
                      strokeWidth="1.5"
                      strokeDasharray="8 8"
                    />
                    <line
                      x1="600"
                      y1="36"
                      x2="600"
                      y2="396"
                      stroke="#F8FAFC"
                      strokeWidth="1.5"
                      strokeDasharray="8 8"
                    />
                  </g>

                  {/* Main Gate Callout */}
                  <g>
                    <rect x="22" y="224" width="116" height="30" rx="5" fill="#1E3A8A" />
                    <text
                      x="80"
                      y="243"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10.5"
                      fontWeight="700"
                    >
                      MAIN GATE ENTRY →
                    </text>
                    <text
                      x="446"
                      y="243"
                      textAnchor="middle"
                      fill="#334155"
                      fontSize="10.5"
                      fontWeight="600"
                    >
                      MITS Central Campus Driveway (One-Way Loop)
                    </text>
                  </g>

                  {/* Clickable Parking Zones */}
                  {zones.map((zone) => {
                    const stats = zoneStatsMap[zone.id];
                    const isSelected = zone.id === activeZone.id;
                    const occRatio =
                      stats.total > 0 ? (stats.occupied + stats.reserved) / stats.total : 0;
                    const barColor =
                      occRatio >= 0.85 ? '#DC2626' : occRatio >= 0.6 ? '#D97706' : '#16A34A';
                    const { x, y, width, height } = zone.mapRect;

                    return (
                      <g
                        key={zone.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectZone(zone.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectZone(zone.id);
                          }
                        }}
                        className="cursor-pointer outline-none"
                        aria-label={`${zone.code} ${zone.name}: ${stats.available} available of ${stats.total}`}
                      >
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          rx="10"
                          fill={isSelected ? '#EFF6FF' : '#FFFFFF'}
                          stroke={isSelected ? '#1D4ED8' : '#94A3B8'}
                          strokeWidth={isSelected ? 2.5 : 1.3}
                        />

                        {/* Zone Header */}
                        <text
                          x={x + 14}
                          y={y + 24}
                          fill={isSelected ? '#1D4ED8' : '#0F172A'}
                          fontSize="12"
                          fontWeight="700"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          {zone.code} · {zone.shortName}
                        </text>

                        {/* Open Count */}
                        <text
                          x={x + width - 14}
                          y={y + 24}
                          textAnchor="end"
                          fill={stats.matchingAvailable > 0 ? '#15803D' : '#B91C1C'}
                          fontSize="12"
                          fontWeight="700"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {stats.matchingAvailable} open
                        </text>

                        {/* Landmark Subtext */}
                        <text
                          x={x + 14}
                          y={y + 44}
                          fill="#64748B"
                          fontSize="10.5"
                          fontFamily="DM Sans, sans-serif"
                        >
                          {zone.accessPolicy}
                        </text>

                        {/* Stats Row */}
                        <text
                          x={x + 14}
                          y={y + 72}
                          fill="#334155"
                          fontSize="11"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          Avail: {stats.available}  ·  Occ: {stats.occupied}  ·  Total: {stats.total}
                        </text>

                        {/* Occupancy Bar */}
                        <rect
                          x={x + 14}
                          y={y + 86}
                          width={width - 28}
                          height="8"
                          rx="4"
                          fill="#E2E8F0"
                        />
                        <rect
                          x={x + 14}
                          y={y + 86}
                          width={Math.max(6, Math.round((width - 28) * occRatio))}
                          height="8"
                          rx="4"
                          fill={barColor}
                        />

                        <text
                          x={x + 14}
                          y={y + 109}
                          fill="#64748B"
                          fontSize="9.5"
                          fontFamily="DM Sans, sans-serif"
                        >
                          {isSelected ? 'Selected — inspect slots below' : 'Click to view bays'}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Quick Zone Selector Strip for Mobile / Keyboard */}
            <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
              {zones.map((z) => {
                const st = zoneStatsMap[z.id];
                const isSelected = z.id === activeZone.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => handleSelectZone(z.id)}
                    className={`px-3 py-2 rounded-lg border text-left transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-semibold">{z.code}</span>
                    <span
                      className={`ml-2 text-xs font-mono tabular-nums ${
                        isSelected ? 'text-blue-100' : 'text-emerald-700'
                      }`}
                    >
                      {st.available}/{st.total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual Clickable Parking Bays for Selected Zone */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-semibold text-base text-slate-900">
                  {activeZone.code} — {activeZone.name}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activeZone.landmark} · {activeZone.accessPolicy}
                </p>
              </div>

              {/* Explicit Legend (Color + Text Label) */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                  Available
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-600" />
                  Occupied
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-600" />
                  Reserved
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-500" />
                  Maintenance
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Row A */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  North Bay Row ({rowASlots.length} bays)
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {rowASlots.map((slot) => {
                    const meta = getStatusMeta(slot.status);
                    const isSelected = selectedSlot?.id === slot.id;
                    const highlighted = isSlotHighlighted(slot);

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setSelectedSlotId(slot.id);
                          setActionError(null);
                        }}
                        className={`relative flex flex-col justify-between p-2.5 min-h-[76px] rounded-lg border text-left transition-all ${
                          meta.slotBg
                        } ${meta.slotBorder} ${meta.slotHover} ${
                          isSelected ? 'ring-2 ring-blue-700 ring-offset-1 border-blue-700' : ''
                        } ${highlighted ? 'opacity-100' : 'opacity-30'}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                            {slot.id}
                          </span>
                          <VehicleIcon type={slot.vehicleType} className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <div className="mt-2">
                          <p className={`text-[11px] font-semibold ${meta.textColor}`}>
                            {meta.shortLabel}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 truncate">
                            {slot.vehicleReg ? slot.vehicleReg.slice(-4) : VEHICLE_TYPE_LABELS[slot.vehicleType].split(' ')[0]}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campus Driving Aisle Divider */}
              <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-slate-100 border border-dashed border-slate-300 text-[11px] font-medium text-slate-500">
                <span>ENTRY →</span>
                <span>Driving Lane · {activeZone.code}</span>
                <span>→ EXIT</span>
              </div>

              {/* Row B */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  South Bay Row ({rowBSlots.length} bays)
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {rowBSlots.map((slot) => {
                    const meta = getStatusMeta(slot.status);
                    const isSelected = selectedSlot?.id === slot.id;
                    const highlighted = isSlotHighlighted(slot);

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setSelectedSlotId(slot.id);
                          setActionError(null);
                        }}
                        className={`relative flex flex-col justify-between p-2.5 min-h-[76px] rounded-lg border text-left transition-all ${
                          meta.slotBg
                        } ${meta.slotBorder} ${meta.slotHover} ${
                          isSelected ? 'ring-2 ring-blue-700 ring-offset-1 border-blue-700' : ''
                        } ${highlighted ? 'opacity-100' : 'opacity-30'}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                            {slot.id}
                          </span>
                          <VehicleIcon type={slot.vehicleType} className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                        <div className="mt-2">
                          <p className={`text-[11px] font-semibold ${meta.textColor}`}>
                            {meta.shortLabel}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 truncate">
                            {slot.vehicleReg ? slot.vehicleReg.slice(-4) : VEHICLE_TYPE_LABELS[slot.vehicleType].split(' ')[0]}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Interactive Slot Inspector & Action Panel */}
        <aside className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-5 xl:sticky xl:top-24">
          {selectedSlot ? (
            <>
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{activeZone.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>{VEHICLE_TYPE_LABELS[selectedSlot.vehicleType]}</span>
                  </div>
                  <h3 className="mt-1 font-display text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    Bay {selectedSlot.id}
                  </h3>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      getStatusMeta(selectedSlot.status).textColor
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        getStatusMeta(selectedSlot.status).dotColor
                      }`}
                    />
                    {getStatusMeta(selectedSlot.status).label}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {selectedSlot.allowedRoles.includes('student')
                      ? 'Student & Faculty'
                      : 'Faculty / Admin Only'}
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {actionError}
                </div>
              )}

              {/* State 1: Available Slot -> Direct Reservation Form */}
              {selectedSlot.status === 'available' && (
                <div className="space-y-4">
                  {!currentUser ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">
                        Sign in with a Student, Faculty, or Admin demo account to reserve bay{' '}
                        <span className="font-mono font-semibold">{selectedSlot.id}</span>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setAuthModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
                      >
                        Sign In to Reserve
                      </button>
                    </div>
                  ) : !userCanReserveSlot ? (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                        <Lock className="w-4 h-4" />
                        Faculty / Staff Priority Bay
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        You are signed in as <strong>{ROLE_LABELS[currentUser.role]}</strong>. Zone
                        A car bays are reserved for Faculty &amp; Staff. Select a bay in Zone B, C,
                        D, or E, or switch to the Faculty demo account.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleReserveSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Select Your Vehicle
                        </label>
                        <select
                          value={selectedVehicleReg}
                          onChange={(e) => setSelectedVehicleReg(e.target.value)}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-mono"
                        >
                          {currentUser.vehicles.map((v) => (
                            <option key={v.id} value={v.regNumber}>
                              {v.regNumber} — {v.model}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Or Enter Alternate Registration Plate
                        </label>
                        <input
                          type="text"
                          value={customReg}
                          onChange={(e) => setCustomReg(e.target.value)}
                          placeholder="e.g. MP 07 MJ 4821"
                          className="mt-1 w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-200"
                        />
                      </div>

                      <div>
                        <span className="block text-xs font-medium text-slate-700 mb-1.5">
                          Hold Duration
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 4, 8].map((hrs) => (
                            <button
                              key={hrs}
                              type="button"
                              onClick={() => setDurationHours(hrs)}
                              className={`py-2 rounded-lg text-xs font-medium border transition-colors tabular-nums ${
                                durationHours === hrs
                                  ? 'bg-blue-700 text-white border-blue-700'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {hrs === 8 ? 'Full Day' : `${hrs} hr`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700">
                          Purpose / Lecture Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={reserveNotes}
                          onChange={(e) => setReserveNotes(e.target.value)}
                          placeholder="e.g. CSBS Lab / Library Study"
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
                      >
                        Reserve Bay {selectedSlot.id}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* State 2: Occupied or Reserved Details */}
              {(selectedSlot.status === 'occupied' || selectedSlot.status === 'reserved') && (
                <div className="space-y-4">
                  <dl className="divide-y divide-slate-100 text-sm">
                    <div className="py-2 flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500">Registration Plate</dt>
                      <dd className="font-mono font-semibold text-slate-900">
                        {selectedSlot.vehicleReg ?? 'Unassigned'}
                      </dd>
                    </div>
                    <div className="py-2 flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500">Vehicle Model</dt>
                      <dd className="text-xs font-medium text-slate-800">
                        {selectedSlot.vehicleModel ?? 'Standard Campus Vehicle'}
                      </dd>
                    </div>
                    <div className="py-2 flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500">Driver / Holder</dt>
                      <dd className="text-xs font-medium text-slate-800 text-right">
                        {selectedSlot.occupantName ?? 'Campus Commuter'}
                      </dd>
                    </div>
                    <div className="py-2 flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500">Role &amp; Dept</dt>
                      <dd className="text-xs text-slate-700 text-right">
                        {selectedSlot.occupantRole ? ROLE_LABELS[selectedSlot.occupantRole] : 'Member'}
                        {selectedSlot.department ? ` · ${selectedSlot.department}` : ''}
                      </dd>
                    </div>
                    <div className="py-2 flex items-center justify-between gap-2">
                      <dt className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedSlot.status === 'reserved' ? 'Held Window' : 'Parked Since'}
                      </dt>
                      <dd className="text-xs font-mono tabular-nums text-slate-800">
                        {selectedSlot.status === 'reserved'
                          ? `${selectedSlot.since ?? 'Now'} – ${selectedSlot.reservedUntil ?? 'Later'}`
                          : selectedSlot.since ?? 'Today'}
                      </dd>
                    </div>
                  </dl>

                  {selectedSlot.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      {selectedSlot.notes}
                    </p>
                  )}

                  {/* Owner / Admin Actions */}
                  {(userOwnsSelectedSlot || currentUser?.role === 'admin') && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {selectedSlot.status === 'reserved' && selectedSlotReservation && (
                        <button
                          type="button"
                          onClick={() => checkInReservation(selectedSlotReservation.id)}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Arrival (Check In)
                        </button>
                      )}

                      {selectedSlot.status === 'reserved' && selectedSlotReservation ? (
                        <button
                          type="button"
                          onClick={() => cancelReservation(selectedSlotReservation.id)}
                          className="w-full py-2 px-4 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
                        >
                          Cancel Reservation &amp; Free Bay
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => checkOutSlot(selectedSlot.id)}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Check Out &amp; Release Bay
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* State 3: Maintenance */}
              {selectedSlot.status === 'maintenance' && (
                <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Wrench className="w-4 h-4 text-slate-600" />
                    Bay Temporarily Closed
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedSlot.notes || 'Closed by Campus Parking Admin for scheduled work.'}
                  </p>
                </div>
              )}

              {/* Admin Override Controls inside Slot Inspector */}
              {currentUser?.role === 'admin' && (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-700" />
                    Admin Slot Override
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => adminUpdateSlotStatus(selectedSlot.id, 'available')}
                      disabled={selectedSlot.status === 'available'}
                      className="py-2 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Mark Available
                    </button>
                    <button
                      type="button"
                      onClick={() => adminUpdateSlotStatus(selectedSlot.id, 'maintenance')}
                      disabled={selectedSlot.status === 'maintenance'}
                      className="py-2 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Set Maintenance
                    </button>
                  </div>

                  {selectedSlot.status === 'available' && (
                    <form onSubmit={handleAdminManualOccupy} className="space-y-2 pt-1">
                      <p className="text-[11px] font-medium text-slate-500">
                        Log Walk-in Vehicle Entry
                      </p>
                      <input
                        type="text"
                        value={adminRegInput}
                        onChange={(e) => setAdminRegInput(e.target.value)}
                        placeholder="MP 07 AB 1234"
                        className="w-full px-3 py-1.5 text-xs font-mono uppercase rounded-lg border border-slate-200"
                      />
                      <input
                        type="text"
                        value={adminNameInput}
                        onChange={(e) => setAdminNameInput(e.target.value)}
                        placeholder="Driver Name (optional)"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 px-3 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-900"
                      >
                        Mark Occupied
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center space-y-2">
              <MapPin className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-700">Select a parking bay</p>
              <p className="text-xs text-slate-500">
                Click any slot on the MITS Gwalior map to inspect or reserve it.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
