import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  History,
  LogOut,
  Plus,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { ROLE_LABELS, VEHICLE_TYPE_LABELS } from '../data/seedData';
import { VehicleType } from '../types/parking';
import { UserAvatar, VehicleIcon } from './VehicleIcon';

export function ProfileVehiclesView() {
  const {
    currentUser,
    history,
    notifications,
    addVehicle,
    removeVehicle,
    setPrimaryVehicle,
    updateUserProfile,
    markNotificationRead,
    markAllNotificationsRead,
    logout,
    setAuthModalOpen,
  } = useParking();

  const [editName, setEditName] = useState(currentUser?.name ?? '');
  const [editDept, setEditDept] = useState(currentUser?.department ?? '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone ?? '');

  useEffect(() => {
    setEditName(currentUser?.name ?? '');
    setEditDept(currentUser?.department ?? '');
    setEditPhone(currentUser?.phone ?? '');
  }, [currentUser?.id, currentUser?.name, currentUser?.department, currentUser?.phone]);

  const [newReg, setNewReg] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newType, setNewType] = useState<VehicleType>('two-wheeler');
  const [vehError, setVehError] = useState<string | null>(null);

  const userHistory = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return history;
    return history.filter((h) => h.userId === currentUser.id);
  }, [history, currentUser]);

  if (!currentUser) {
    return (
      <section className="bg-white border border-slate-200 rounded-xl p-8 max-w-xl mx-auto text-center space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900">Sign In Required</h2>
        <p className="text-sm text-slate-500">
          Select a Student, Faculty/Staff, or Admin demo account to manage vehicles and view parking
          history.
        </p>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800"
        >
          Open Demo Sign In
        </button>
      </section>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: editName || currentUser.name,
      department: editDept || currentUser.department,
      phone: editPhone || currentUser.phone,
    });
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addVehicle({
      regNumber: newReg,
      model: newModel,
      color: newColor || 'Standard',
      type: newType,
    });
    if (!res.ok) {
      setVehError(res.message);
      return;
    }
    setVehError(null);
    setNewReg('');
    setNewModel('');
    setNewColor('');
  };

  return (
    <div className="space-y-6">
      {/* Top Row: User Profile & Vehicle Garage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Profile Card */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5 min-w-0">
              <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="lg" />
              <div className="min-w-0">
                <h2 className="font-display font-bold text-base text-slate-900 truncate">
                  {currentUser.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {ROLE_LABELS[currentUser.role]} · {currentUser.campusId}
                </p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Display Name</span>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={currentUser.name}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Department / Branch</span>
              <input
                type="text"
                value={editDept}
                onChange={(e) => setEditDept(e.target.value)}
                placeholder={currentUser.department}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Campus Contact Phone</span>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder={currentUser.phone}
                className="mt-1 w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200"
              />
            </label>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800"
              >
                <Save className="w-3.5 h-3.5" />
                Save Profile
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </form>
        </section>

        {/* Vehicle Garage Management */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <div>
            <h3 className="font-display font-semibold text-base text-slate-900">
              My Registered Vehicles ({currentUser.vehicles.length})
            </h3>
            <p className="text-xs text-slate-500">
              Add your bike, scooter, car, or bicycle once for one-click slot reservations.
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {currentUser.vehicles.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 text-center">
                No vehicles added yet. Register one below.
              </p>
            ) : (
              currentUser.vehicles.map((veh) => (
                <div
                  key={veh.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/70"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <VehicleIcon type={veh.type} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-slate-900">
                          {veh.regNumber}
                        </span>
                        {veh.isPrimary && (
                          <span className="text-[11px] font-semibold text-blue-700">Primary</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {veh.model} · {VEHICLE_TYPE_LABELS[veh.type]} · {veh.color}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!veh.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryVehicle(veh.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        <Star className="w-3 h-3" />
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeVehicle(veh.id)}
                      aria-label={`Remove ${veh.regNumber}`}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddVehicle} className="pt-2 space-y-3">
            <p className="text-xs font-semibold text-slate-800">Register Another Vehicle</p>
            {vehError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {vehError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={newReg}
                onChange={(e) => setNewReg(e.target.value)}
                placeholder="Reg Plate (e.g. MP 07 AB 4521)"
                className="px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-200"
              />
              <input
                type="text"
                required
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Model (e.g. TVS Jupiter 125)"
                className="px-3 py-2 text-sm rounded-lg border border-slate-200"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as VehicleType)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
              >
                {(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map((vt) => (
                  <option key={vt} value={vt}>
                    {VEHICLE_TYPE_LABELS[vt]}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Color (optional)"
                className="px-3 py-2 text-sm rounded-lg border border-slate-200"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Vehicle
            </button>
          </form>
        </section>
      </div>

      {/* Bottom Row: Parking History & Notifications Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Parking History */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="font-display font-semibold text-base text-slate-900">
                Parking Session History
              </h3>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {userHistory.length} records
            </span>
          </div>

          {userHistory.length === 0 ? (
            <p className="p-8 text-sm text-slate-500 text-center">
              No completed parking sessions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-2.5 px-4">Date &amp; Bay</th>
                    <th className="py-2.5 px-4">Vehicle</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {userHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <p className="text-xs font-semibold text-slate-900">
                          <span className="font-mono">{item.slotId}</span> · {item.date}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.zoneName}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                        {item.vehicleReg}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-mono tabular-nums text-slate-800">
                          {item.durationLabel}
                        </p>
                        <p className="text-[11px] font-mono tabular-nums text-slate-500">
                          {item.checkInTime} – {item.checkOutTime}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-xs font-semibold ${
                            item.status === 'Completed' ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Notifications Log */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <h3 className="font-display font-semibold text-base text-slate-900">
                Campus Alerts &amp; Activity
              </h3>
            </div>
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-xs text-slate-500 text-center">No notifications recorded.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markNotificationRead(n.id)}
                  className={`w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors ${
                    n.read ? 'bg-white' : 'bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
