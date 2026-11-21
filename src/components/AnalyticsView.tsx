import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useParking } from '../context/ParkingContext';
import { HOURLY_DEMAND_BASELINE, VEHICLE_TYPE_LABELS } from '../data/seedData';
import { VehicleType } from '../types/parking';

const PIE_COLORS = ['#1D4ED8', '#0F766E', '#D97706', '#475569', '#7C3AED'];

export function AnalyticsView() {
  const { zones, slots, reservations, history } = useParking();

  const zoneChartData = useMemo(() => {
    return zones.map((zone) => {
      const zSlots = slots.filter((s) => s.zoneId === zone.id);
      const available = zSlots.filter((s) => s.status === 'available').length;
      const occupied = zSlots.filter((s) => s.status === 'occupied').length;
      const reserved = zSlots.filter((s) => s.status === 'reserved').length;
      const maintenance = zSlots.filter((s) => s.status === 'maintenance').length;
      const utilPct =
        zSlots.length > 0 ? Math.round(((occupied + reserved) / zSlots.length) * 100) : 0;

      return {
        zone: zone.code,
        shortName: zone.shortName,
        total: zSlots.length,
        available,
        occupied,
        reserved,
        maintenance,
        utilPct,
      };
    });
  }, [zones, slots]);

  const vehicleTypeBreakdown = useMemo(() => {
    const types: VehicleType[] = ['two-wheeler', 'car', 'ev', 'bicycle', 'accessible'];
    return types.map((type) => {
      const subset = slots.filter((s) => s.vehicleType === type);
      const inUse = subset.filter((s) => s.status === 'occupied' || s.status === 'reserved').length;
      return {
        name: VEHICLE_TYPE_LABELS[type].split(' ')[0],
        fullName: VEHICLE_TYPE_LABELS[type],
        total: subset.length,
        inUse,
        available: subset.filter((s) => s.status === 'available').length,
      };
    });
  }, [slots]);

  const summary = useMemo(() => {
    const total = slots.length;
    const inUse = slots.filter((s) => s.status === 'occupied' || s.status === 'reserved').length;
    const utilPct = total > 0 ? Math.round((inUse / total) * 100) : 0;
    const busiestZone = [...zoneChartData].sort((a, b) => b.utilPct - a.utilPct)[0];
    const activeResCount = reservations.filter(
      (r) => r.status === 'active' || r.status === 'checked-in'
    ).length;
    return { total, inUse, utilPct, busiestZone, activeResCount };
  }, [slots, zoneChartData, reservations]);

  return (
    <div className="space-y-6">
      {/* Analytics KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Current Occupancy Rate</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {summary.utilPct}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
            {summary.inUse} of {summary.total} bays occupied/held
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Highest Demand Zone</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-slate-900">
            {summary.busiestZone?.zone ?? 'Zone B'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
            {summary.busiestZone?.shortName} · {summary.busiestZone?.utilPct ?? 0}% utilized
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Active Reservations</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-amber-700 tabular-nums">
            {summary.activeResCount}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Held across all 5 zones</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Logged Sessions</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-blue-700 tabular-nums">
            {history.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Completed &amp; archived entries</p>
        </div>
      </section>

      {/* Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stacked Bar Chart: Live Zone Occupancy */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="font-display font-semibold text-base text-slate-900">
              Zone Capacity &amp; Occupancy Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Updates automatically as slots are reserved, checked in, or released in the demo.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="occupied" name="Occupied" stackId="a" fill="#DC2626" radius={[0, 0, 0, 0]} />
                <Bar dataKey="reserved" name="Reserved" stackId="a" fill="#D97706" />
                <Bar dataKey="available" name="Available" stackId="a" fill="#16A34A" />
                <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Campus Bay Allocation by Vehicle Type */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-semibold text-base text-slate-900">
              Slots by Vehicle Category
            </h2>
            <p className="text-xs text-slate-500">
              Distribution of all {summary.total} campus parking bays across vehicle classes.
            </p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleTypeBreakdown}
                  dataKey="total"
                  nameKey="fullName"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={2}
                >
                  {vehicleTypeBreakdown.map((entry, idx) => (
                    <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {vehicleTypeBreakdown.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-600 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  {item.name}
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {item.inUse}/{item.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modeled Hourly Weekday Demand Chart */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display font-semibold text-base text-slate-900">
              Typical Weekday Campus Demand Curve (8:00 AM – 6:00 PM)
            </h2>
            <p className="text-xs text-slate-500">
              Modeled demo dataset reflecting MITS Gwalior lecture peaks (10:00 AM – 12:00 PM) and
              lunch dispersal (1:00 PM).
            </p>
          </div>
          <span className="text-xs text-slate-400">Reference demo baseline</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={HOURLY_DEMAND_BASELINE}
              margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                unit="%"
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Campus Utilization']}
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="occupancyPct"
                stroke="#1D4ED8"
                strokeWidth={2}
                fill="url(#occGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tabular Zone Utilization Report */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-display font-semibold text-base text-slate-900">
            Zone Utilization Summary
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Available</th>
                <th className="py-3 px-4 text-right">Occupied</th>
                <th className="py-3 px-4 text-right">Reserved</th>
                <th className="py-3 px-4 text-right">Maintenance</th>
                <th className="py-3 px-4 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {zoneChartData.map((row) => (
                <tr key={row.zone} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{row.zone}</span>
                    <span className="ml-2 text-xs text-slate-500">{row.shortName}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                    {row.total}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                    {row.available}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700 font-medium">
                    {row.occupied}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-700 font-medium">
                    {row.reserved}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                    {row.maintenance}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {row.utilPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
