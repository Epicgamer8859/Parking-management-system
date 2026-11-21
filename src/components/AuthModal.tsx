import React, { useState } from 'react';
import { ArrowRight, KeyRound, UserPlus, X } from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { CAMPUS_IMAGE_URL, ROLE_LABELS, VEHICLE_TYPE_LABELS } from '../data/seedData';
import { UserRole, VehicleType } from '../types/parking';
import { UserAvatar } from './VehicleIcon';

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen, users, currentUser, loginAsUser, registerDemoUser } =
    useParking();
  const [mode, setMode] = useState<'preset' | 'register'>('preset');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [campusId, setCampusId] = useState('0901CSBS251099');
  const [department, setDepartment] = useState('B.Tech CSBS (1st Year)');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98260 55123');
  const [vehicleReg, setVehicleReg] = useState('MP 07 ML 2045');
  const [vehicleModel, setVehicleModel] = useState('Honda Activa 6G');
  const [vehicleType, setVehicleType] = useState<VehicleType>('two-wheeler');
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const res = registerDemoUser({
      name,
      role,
      campusId,
      department,
      email,
      phone,
      vehicleReg,
      vehicleModel,
      vehicleType,
    });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setError(null);
    setName('');
    setMode('preset');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-[2px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Visual Context Panel */}
          <div className="md:col-span-5 relative bg-slate-900 text-white min-h-[180px] md:min-h-[480px] flex flex-col justify-between p-6 overflow-hidden">
            <img
              src={CAMPUS_IMAGE_URL}
              alt="MITS Gwalior Campus Driveway and Parking"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/30" />

            <div className="relative z-10">
              <p className="text-xs font-medium text-blue-200">
                Madhav Institute of Technology &amp; Science
              </p>
              <h2 id="auth-modal-title" className="mt-1 font-display text-xl font-bold text-white">
                MITS Smart Parking
              </h2>
            </div>

            <div className="relative z-10 space-y-2 text-xs text-slate-200 leading-relaxed">
              <p>
                Demo role-based authentication lets you test Student, Faculty/Staff, and Campus
                Admin permissions instantly.
              </p>
              <p className="text-slate-300 pt-2 border-t border-white/15">
                Team NeonDrive · Shubham Khare &amp; Sohit Patel (B.Tech CSBS)
              </p>
            </div>
          </div>

          {/* Right Interactive Form / Role Picker */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex p-1 rounded-lg bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setMode('preset')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      mode === 'preset'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Demo Roles
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      mode === 'register'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Create Demo User
                  </button>
                </div>

                {currentUser && (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(false)}
                    aria-label="Close sign in dialog"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {mode === 'preset' ? (
                <div className="mt-5 space-y-3">
                  <div>
                    <h3 className="font-display font-semibold text-base text-slate-900">
                      Select a Role-Based Dashboard
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Each demo account has distinct MITS zone access, registered vehicles, and
                      controls.
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-[330px] overflow-y-auto pr-1">
                    {users.map((user) => {
                      const isCurrent = currentUser?.id === user.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => loginAsUser(user.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                            isCurrent
                              ? 'border-blue-600 bg-blue-50/50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <span className="truncate">{user.name}</span>
                                {isCurrent && (
                                  <span className="text-xs font-medium text-blue-700 shrink-0">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">
                                {ROLE_LABELS[user.role]} · {user.department}
                              </p>
                              <p className="mt-0.5 text-[11px] font-mono text-slate-500 truncate">
                                {user.campusId} · {user.vehicles[0]?.regNumber ?? 'No vehicle'}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="mt-5 space-y-3">
                  <div>
                    <h3 className="font-display font-semibold text-base text-slate-900">
                      Create Custom Demo Profile
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Stored locally in your browser session for project presentations.
                    </p>
                  </div>

                  {error && (
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Full Name</span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ananya Verma"
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-600 outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Campus Role</span>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty / Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Roll / Emp ID</span>
                      <input
                        type="text"
                        value={campusId}
                        onChange={(e) => setCampusId(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Department</span>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">
                        Vehicle Reg Number
                      </span>
                      <input
                        type="text"
                        required
                        value={vehicleReg}
                        onChange={(e) => setVehicleReg(e.target.value)}
                        placeholder="MP 07 AB 1234"
                        className="mt-1 w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Vehicle Type</span>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as VehicleType)}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Vehicle Model</span>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-700">Phone (Optional)</span>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                      />
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Sign In with New Profile
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                Local persistent demo authentication
              </span>
              <span>No external server required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
