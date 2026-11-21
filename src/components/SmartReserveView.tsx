import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Footprints,
  LogOut,
  MapPin,
  Search,
  XCircle,
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { CAMPUS_DESTINATIONS, VEHICLE_TYPE_LABELS } from '../data/seedData';
import { VehicleType } from '../types/parking';
import { VehicleIcon } from './VehicleIcon';

export function SmartReserveView() {
  const {
    zones,
    slots,
    reservations,
    currentUser,
    reserveSlot,
    checkInReservation,
    checkOutSlot,
    cancelReservation,
    jumpToSlotOnMap,
    setAuthModalOpen,
  } = useParking();

  const defaultVehicle = currentUser?.vehicles.find((v) => v.isPrimary) ?? currentUser?.vehicles[0];

  const [destinationId, setDestinationId] = useState<string>('csbs-block');
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    defaultVehicle?.type ?? 'two-wheeler'
  );
  const [durationHours, setDurationHours] = useState<number>(2);
  const [selectedReg, setSelectedReg] = useState<string>(defaultVehicle?.regNumber ?? '');
  const [notes, setNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const primary = currentUser?.vehicles.find((v) => v.isPrimary) ?? currentUser?.vehicles[0];
    setSelectedReg(primary?.regNumber ?? '');
    if (primary?.type) {
      setVehicleType(primary.type);
    }
  }, [currentUser?.id, currentUser?.vehicles]);

  // Compute ranked recommended available slots for chosen MITS destination + vehicle type
  const recommendedSlots = useMemo(() => {
    const role = currentUser?.role ?? 'student';
    const eligible = slots.filter(
      (s) =>
        s.status === 'available' &&
        s.vehicleType === vehicleType &&
        (role === 'admin' || s.allowedRoles.includes(role))
    );

    return eligible
      .map((slot) => {
        const zone = zones.find((z) => z.id === slot.zoneId)!;
        const walkMins = zone.walkingMinutesTo[destinationId] ?? 5;
        const zoneAvailCount = slots.filter(
          (s) => s.zoneId === zone.id && s.status === 'available'
        ).length;
        // Score prefers closest walking distance, then higher zone availability
        const score = walkMins * 10 - Math.min(zoneAvailCount, 9);
        return { slot, zone, walkMins, zoneAvailCount, score };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 6);
  }, [slots, zones, vehicleType, destinationId, currentUser?.role]);

  const activeReservations = useMemo(() => {
    if (!currentUser) return [];
    const list =
      currentUser.role === 'admin'
        ? reservations
        : reservations.filter((r) => r.userId === currentUser.id);
    return list.filter((r) => r.status === 'active' || r.status === 'checked-in');
  }, [reservations, currentUser]);

  const handleQuickBook = (slotId: string, slotVehicleType: VehicleType) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    const matchingVehicle =
      currentUser.vehicles.find((v) => v.regNumber === selectedReg) ??
      currentUser.vehicles.find((v) => v.type === slotVehicleType) ??
      currentUser.vehicles[0];

    const regToUse = selectedReg.trim() || matchingVehicle?.regNumber || 'MP 07 MJ 4821';
    const res = reserveSlot({
      slotId,
      vehicleReg: regToUse,
      vehicleType: slotVehicleType,
      vehicleModel: matchingVehicle?.model ?? 'Campus Vehicle',
      durationHours,
      notes: notes || `Smart booked for ${CAMPUS_DESTINATIONS.find((d) => d.id === destinationId)?.label}`,
    });
    if (!res.ok) {
      setFeedback(res.message);
      return;
    }
    setFeedback(null);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Smart Finder Form */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Smart Parking Finder — MITS Gwalior
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select your destination block and vehicle type to find the closest eligible open bays
            ranked by walking distance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">Destination Block</span>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white"
            >
              {CAMPUS_DESTINATIONS.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">Vehicle Category</span>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white"
            >
              {(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map((vt) => (
                <option key={vt} value={vt}>
                  {VEHICLE_TYPE_LABELS[vt]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">Vehicle Registration</span>
            {currentUser && currentUser.vehicles.length > 0 ? (
              <select
                value={selectedReg || currentUser.vehicles[0].regNumber}
                onChange={(e) => setSelectedReg(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 text-sm font-mono rounded-lg border border-slate-200 bg-white"
              >
                {currentUser.vehicles.map((v) => (
                  <option key={v.id} value={v.regNumber}>
                    {v.regNumber} ({v.model})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedReg}
                onChange={(e) => setSelectedReg(e.target.value)}
                placeholder="MP 07 MJ 4821"
                className="mt-1 w-full px-3 py-2.5 text-sm font-mono uppercase rounded-lg border border-slate-200"
              />
            )}
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">Reservation Duration</span>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white"
            >
              <option value={1}>1 Hour (Short Visit)</option>
              <option value={2}>2 Hours (Lecture / Lab)</option>
              <option value={4}>4 Hours (Half Day)</option>
              <option value={8}>8 Hours (Full Campus Day)</option>
            </select>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note (e.g. CSBS Lab 204, Central Library exam prep)"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200"
          />
          <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
            {recommendedSlots.length} best matches shown
          </span>
        </div>

        {feedback && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {feedback}
          </div>
        )}
      </section>

      {/* Recommended Slots Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-base text-slate-900">
            Recommended Open Bays
          </h3>
          <span className="text-xs text-slate-500">
            Sorted by walking time to{' '}
            {CAMPUS_DESTINATIONS.find((d) => d.id === destinationId)?.label}
          </span>
        </div>

        {recommendedSlots.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
            <Search className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">
              No eligible open bays match {VEHICLE_TYPE_LABELS[vehicleType]}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try another vehicle category or check if Zone A slots require a Faculty/Admin demo
              role.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedSlots.map(({ slot, zone, walkMins, zoneAvailCount }, idx) => (
              <div
                key={slot.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                      {slot.id}
                    </span>
                    <span className="text-xs font-medium text-emerald-700">
                      {idx === 0 ? 'Closest Match' : `${walkMins} min walk`}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    {zone.code} · {zone.shortName}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <VehicleIcon type={slot.vehicleType} className="w-3.5 h-3.5" />
                      {VEHICLE_TYPE_LABELS[slot.vehicleType]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Footprints className="w-3.5 h-3.5" />
                      {walkMins} min
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{zoneAvailCount} open in zone</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleQuickBook(slot.id, slot.vehicleType)}
                    className="flex-1 py-2 px-3 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors whitespace-nowrap"
                  >
                    Reserve Bay
                  </button>
                  <button
                    type="button"
                    onClick={() => jumpToSlotOnMap(slot.id)}
                    className="inline-flex items-center gap-1 py-2 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    Map
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Reservations Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold text-base text-slate-900">
              {currentUser?.role === 'admin' ? 'All Active Campus Reservations' : 'My Active Reservations'}
            </h3>
            <p className="text-xs text-slate-500">
              Check in upon reaching the bay, or cancel to release the space immediately.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {activeReservations.length} active
          </span>
        </div>

        {activeReservations.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CalendarCheck className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-700">No active reservations</p>
            <p className="text-xs text-slate-500">
              Use the Smart Parking Finder above or click any green slot on the Campus Map to hold a
              bay.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 bg-slate-50/70">
                  <th className="py-3 px-4">Reservation</th>
                  <th className="py-3 px-4">Bay &amp; Zone</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Window</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {activeReservations.map((res) => {
                  const zone = zones.find((z) => z.id === res.zoneId);
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4">
                        <p className="font-mono text-xs font-semibold text-slate-900">{res.id}</p>
                        <p className="text-xs text-slate-500">{res.userName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => jumpToSlotOnMap(res.slotId)}
                          className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-blue-700 hover:underline"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {res.slotId}
                        </button>
                        <p className="text-xs text-slate-500">{zone?.shortName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-mono text-xs font-medium text-slate-900">
                          {res.vehicleReg}
                        </p>
                        <p className="text-xs text-slate-500">
                          {VEHICLE_TYPE_LABELS[res.vehicleType]}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {res.startTime} – {res.endTime}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            res.status === 'checked-in' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {res.status === 'checked-in' ? 'Checked In (Parked)' : 'Reserved'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {res.status === 'active' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => checkInReservation(res.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Check In
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelReservation(res.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => checkOutSlot(res.slotId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Check Out
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
        )}
      </section>
    </div>
  );
}
