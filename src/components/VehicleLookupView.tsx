import { useMemo, useState } from 'react';
import { ArrowUpRight, Car, MapPin, Search, X } from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { ROLE_LABELS, VEHICLE_TYPE_LABELS } from '../data/seedData';
import { getStatusMeta, VehicleIcon } from './VehicleIcon';

const QUICK_PLATES = ['MP 07 MJ 4821', 'MP 07 CK 7742', 'MP 07 MK 6290', 'MP 07 CA 1001'];

export function VehicleLookupView() {
  const { slots, zones, jumpToSlotOnMap } = useParking();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'occupied' | 'reserved'>('all');

  const parkedSlots = useMemo(() => {
    return slots.filter((s) => s.status === 'occupied' || s.status === 'reserved');
  }, [slots]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parkedSlots.filter((slot) => {
      if (statusFilter !== 'all' && slot.status !== statusFilter) return false;
      if (!q) return true;
      const zone = zones.find((z) => z.id === slot.zoneId);
      return (
        slot.vehicleReg?.toLowerCase().includes(q) ||
        slot.id.toLowerCase().includes(q) ||
        slot.occupantName?.toLowerCase().includes(q) ||
        slot.department?.toLowerCase().includes(q) ||
        slot.vehicleModel?.toLowerCase().includes(q) ||
        zone?.name.toLowerCase().includes(q)
      );
    });
  }, [parkedSlots, query, statusFilter, zones]);

  return (
    <div className="space-y-6">
      {/* Search Bar Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Campus Vehicle Registration Lookup
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Search any vehicle currently parked or reserved on MITS Gwalior campus by registration
            number, driver name, department, or bay ID.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search registration number (e.g. MP 07 MJ 4821), driver, or bay B-04..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-blue-600 outline-none font-mono"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-lg shrink-0 self-start">
            {(['all', 'occupied', 'reserved'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'All Logged' : st === 'occupied' ? 'Occupied' : 'Reserved'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Quick demo plates:</span>
          {QUICK_PLATES.map((plate) => (
            <button
              key={plate}
              type="button"
              onClick={() => setQuery(plate)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 font-mono text-xs text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-colors"
            >
              {plate}
            </button>
          ))}
        </div>
      </section>

      {/* Results Directory Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <h3 className="font-display font-semibold text-base text-slate-900">
            Matching Campus Vehicles
          </h3>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {results.length} of {parkedSlots.length} vehicles
          </span>
        </div>

        {results.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Car className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">
              No vehicle found matching &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-slate-500">
              Verify the MP 07 registration digits or clear the status filter to inspect all parked
              vehicles.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Registration Plate</th>
                  <th className="py-3 px-4">Vehicle &amp; Type</th>
                  <th className="py-3 px-4">Owner / Role</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status &amp; Time</th>
                  <th className="py-3 px-4 text-right">Locate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {results.map((slot) => {
                  const zone = zones.find((z) => z.id === slot.zoneId);
                  const meta = getStatusMeta(slot.status);
                  return (
                    <tr key={slot.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {slot.vehicleReg ?? 'Unregistered'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium text-slate-800">
                          {slot.vehicleModel ?? 'Standard Vehicle'}
                        </p>
                        <p className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                          <VehicleIcon type={slot.vehicleType} className="w-3 h-3" />
                          {VEHICLE_TYPE_LABELS[slot.vehicleType]}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-medium text-slate-800">
                          {slot.occupantName ?? 'Campus Commuter'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {slot.occupantRole ? ROLE_LABELS[slot.occupantRole] : 'Member'}
                          {slot.department ? ` · ${slot.department}` : ''}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono text-xs font-semibold text-slate-900">{slot.id}</p>
                        <p className="text-[11px] text-slate-500">
                          {zone?.code} · {zone?.shortName}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className={`text-xs font-semibold ${meta.textColor}`}>{meta.label}</p>
                        <p className="text-[11px] font-mono tabular-nums text-slate-500">
                          Since {slot.since ?? 'Today'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => jumpToSlotOnMap(slot.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          View Bay
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
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
