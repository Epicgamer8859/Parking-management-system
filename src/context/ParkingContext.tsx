import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createInitialSlots,
  INITIAL_HISTORY,
  INITIAL_NOTIFICATIONS,
  INITIAL_RESERVATIONS,
  INITIAL_USERS,
  PARKING_ZONES,
} from '../data/seedData';
import {
  ActiveTab,
  AppNotification,
  DemoUser,
  ParkingHistoryEntry,
  ParkingSlot,
  ParkingZone,
  Reservation,
  SlotStatus,
  UserRole,
  Vehicle,
  VehicleType,
} from '../types/parking';

const STORAGE_KEY = 'mits_smart_parking_state_v1';

interface PersistedState {
  users: DemoUser[];
  currentUserId: string | null;
  slots: ParkingSlot[];
  reservations: Reservation[];
  history: ParkingHistoryEntry[];
  notifications: AppNotification[];
}

interface ActionResult {
  ok: boolean;
  message: string;
}

interface ParkingContextValue {
  zones: ParkingZone[];
  users: DemoUser[];
  currentUser: DemoUser | null;
  slots: ParkingSlot[];
  reservations: Reservation[];
  history: ParkingHistoryEntry[];
  notifications: AppNotification[];
  unreadCount: number;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedZoneId: string;
  setSelectedZoneId: (zoneId: string) => void;
  selectedSlotId: string | null;
  setSelectedSlotId: (slotId: string | null) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  toast: { id: number; message: string; tone: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, tone?: 'success' | 'error' | 'info') => void;
  jumpToSlotOnMap: (slotId: string) => void;
  loginAsUser: (userId: string) => void;
  registerDemoUser: (payload: {
    name: string;
    role: UserRole;
    campusId: string;
    department: string;
    email: string;
    phone: string;
    vehicleReg: string;
    vehicleModel: string;
    vehicleType: VehicleType;
  }) => ActionResult;
  logout: () => void;
  reserveSlot: (payload: {
    slotId: string;
    vehicleReg: string;
    vehicleType: VehicleType;
    vehicleModel?: string;
    durationHours: number;
    notes?: string;
  }) => ActionResult;
  checkInReservation: (reservationId: string) => ActionResult;
  checkOutSlot: (slotId: string) => ActionResult;
  cancelReservation: (reservationId: string) => ActionResult;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => ActionResult;
  removeVehicle: (vehicleId: string) => void;
  setPrimaryVehicle: (vehicleId: string) => void;
  updateUserProfile: (updates: { name: string; department: string; phone: string }) => void;
  adminUpdateSlotStatus: (
    slotId: string,
    status: SlotStatus,
    details?: {
      vehicleReg?: string;
      vehicleModel?: string;
      occupantName?: string;
      occupantRole?: UserRole;
      department?: string;
      notes?: string;
    }
  ) => ActionResult;
  adminAddSlot: (zoneId: string, vehicleType: VehicleType, allowedRoles: UserRole[]) => ActionResult;
  adminRemoveSlot: (slotId: string) => ActionResult;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
}

const ParkingContext = createContext<ParkingContextValue | null>(null);

function formatCurrentTime(offsetHours = 0): string {
  const date = new Date();
  date.setHours(date.getHours() + offsetHours);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getDefaultState(): PersistedState {
  return {
    users: INITIAL_USERS,
    currentUserId: INITIAL_USERS[0].id,
    slots: createInitialSlots(),
    reservations: INITIAL_RESERVATIONS,
    history: INITIAL_HISTORY,
    notifications: INITIAL_NOTIFICATIONS,
  };
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed.slots || !parsed.users || parsed.slots.length === 0) {
      return getDefaultState();
    }
    return {
      users: parsed.users,
      currentUserId:
        parsed.currentUserId !== undefined ? parsed.currentUserId : INITIAL_USERS[0].id,
      slots: parsed.slots,
      reservations: parsed.reservations ?? INITIAL_RESERVATIONS,
      history: parsed.history ?? INITIAL_HISTORY,
      notifications: parsed.notifications ?? INITIAL_NOTIFICATIONS,
    };
  } catch {
    return getDefaultState();
  }
}

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-academic');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>('B-04');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    tone: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors in private mode
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setToast({ id: Date.now(), message, tone });
  };

  const currentUser = useMemo(() => {
    if (!state.currentUserId) return null;
    return state.users.find((u) => u.id === state.currentUserId) ?? null;
  }, [state.users, state.currentUserId]);

  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return state.notifications.filter(
      (n) => n.userId === 'all' || n.userId === currentUser.id
    );
  }, [state.notifications, currentUser]);

  const unreadCount = useMemo(
    () => userNotifications.filter((n) => !n.read).length,
    [userNotifications]
  );

  const pushNotification = (
    prev: AppNotification[],
    notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
  ): AppNotification[] => {
    const entry: AppNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: formatCurrentTime(0),
      read: false,
    };
    return [entry, ...prev].slice(0, 40);
  };

  const jumpToSlotOnMap = (slotId: string) => {
    const slot = state.slots.find((s) => s.id === slotId);
    if (!slot) return;
    setSelectedZoneId(slot.zoneId);
    setSelectedSlotId(slot.id);
    setActiveTab('map');
  };

  const loginAsUser = (userId: string) => {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return;
    setState((prev) => ({ ...prev, currentUserId: user.id }));
    setAuthModalOpen(false);
    if (user.role === 'faculty') {
      setSelectedZoneId('zone-admin');
      setSelectedSlotId('A-06');
    } else if (user.role === 'student') {
      setSelectedZoneId('zone-academic');
      setSelectedSlotId('B-04');
    } else {
      setSelectedZoneId('zone-academic');
      setSelectedSlotId('B-01');
    }
    showToast(`Signed in as ${user.name} (${user.role})`, 'success');
  };

  const registerDemoUser: ParkingContextValue['registerDemoUser'] = (payload) => {
    const cleanName = payload.name.trim();
    const cleanReg = payload.vehicleReg.trim().toUpperCase();
    if (!cleanName || !cleanReg) {
      return { ok: false, message: 'Name and vehicle registration number are required.' };
    }
    const newUser: DemoUser = {
      id: `user-${Date.now()}`,
      name: cleanName,
      role: payload.role,
      email: payload.email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@mitsgwl.ac.in`,
      campusId: payload.campusId.trim() || `MITS-${Math.floor(1000 + Math.random() * 9000)}`,
      department: payload.department.trim() || 'B.Tech CSBS',
      phone: payload.phone.trim() || '+91 98260 00000',
      vehicles: [
        {
          id: `veh-${Date.now()}`,
          regNumber: cleanReg,
          model: payload.vehicleModel.trim() || 'Registered Campus Vehicle',
          type: payload.vehicleType,
          color: 'Standard',
          isPrimary: true,
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUserId: newUser.id,
      notifications: pushNotification(prev.notifications, {
        userId: newUser.id,
        title: 'Demo Account Ready',
        message: `Welcome to MITS Smart Parking, ${newUser.name}. Your vehicle ${cleanReg} is ready for reservations.`,
        category: 'system',
      }),
    }));
    setAuthModalOpen(false);
    showToast(`Created demo account for ${newUser.name}`, 'success');
    return { ok: true, message: 'Demo account created.' };
  };

  const logout = () => {
    setState((prev) => ({ ...prev, currentUserId: null }));
    setAuthModalOpen(true);
    showToast('Signed out of demo session', 'info');
  };

  const reserveSlot: ParkingContextValue['reserveSlot'] = ({
    slotId,
    vehicleReg,
    vehicleType,
    vehicleModel,
    durationHours,
    notes,
  }) => {
    if (!currentUser) {
      return { ok: false, message: 'Please sign in with a demo account first.' };
    }
    const slot = state.slots.find((s) => s.id === slotId);
    if (!slot) {
      return { ok: false, message: 'Selected parking slot was not found.' };
    }
    if (slot.status !== 'available') {
      return { ok: false, message: `Slot ${slot.id} is currently ${slot.status}.` };
    }
    if (!slot.allowedRoles.includes(currentUser.role) && currentUser.role !== 'admin') {
      return {
        ok: false,
        message: `Slot ${slot.id} is restricted to Faculty/Staff priority. Choose Zone B, C, D, or E.`,
      };
    }

    const cleanReg = vehicleReg.trim().toUpperCase();
    if (!cleanReg) {
      return { ok: false, message: 'Enter or select a valid vehicle registration number.' };
    }

    const existingDuplicate = state.slots.find(
      (s) =>
        s.vehicleReg?.toUpperCase() === cleanReg &&
        (s.status === 'occupied' || s.status === 'reserved')
    );
    if (existingDuplicate) {
      return {
        ok: false,
        message: `Vehicle ${cleanReg} already holds slot ${existingDuplicate.id}. Release it first.`,
      };
    }

    const startTime = formatCurrentTime(0);
    const endTime = formatCurrentTime(durationHours);
    const zone = PARKING_ZONES.find((z) => z.id === slot.zoneId);

    const newReservation: Reservation = {
      id: `RES-${Math.floor(2600 + Math.random() * 7000)}`,
      slotId: slot.id,
      zoneId: slot.zoneId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      department: currentUser.department,
      vehicleReg: cleanReg,
      vehicleType,
      createdAt: `Today, ${startTime}`,
      startTime,
      endTime,
      durationHours,
      status: 'active',
      notes: notes?.trim() || undefined,
    };

    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === slot.id
          ? {
              ...s,
              status: 'reserved',
              vehicleReg: cleanReg,
              vehicleModel: vehicleModel || 'Registered Vehicle',
              occupantName: currentUser.name,
              occupantRole: currentUser.role,
              occupantId: currentUser.id,
              department: currentUser.department,
              since: startTime,
              reservedUntil: endTime,
              notes: notes?.trim() || undefined,
            }
          : s
      ),
      reservations: [newReservation, ...prev.reservations],
      notifications: pushNotification(prev.notifications, {
        userId: currentUser.id,
        title: `Reserved Slot ${slot.id}`,
        message: `Held bay ${slot.id} in ${zone?.shortName ?? slot.zoneId} for ${cleanReg} until ${endTime}.`,
        category: 'reservation',
      }),
    }));

    showToast(`Slot ${slot.id} reserved for ${cleanReg} until ${endTime}`, 'success');
    return { ok: true, message: `Reserved slot ${slot.id}.` };
  };

  const checkInReservation = (reservationId: string): ActionResult => {
    const res = state.reservations.find((r) => r.id === reservationId);
    if (!res) return { ok: false, message: 'Reservation not found.' };
    const nowTime = formatCurrentTime(0);

    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === res.slotId
          ? {
              ...s,
              status: 'occupied',
              since: nowTime,
            }
          : s
      ),
      reservations: prev.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: 'checked-in', startTime: nowTime } : r
      ),
      notifications: pushNotification(prev.notifications, {
        userId: res.userId,
        title: `Checked In at Slot ${res.slotId}`,
        message: `Vehicle ${res.vehicleReg} is now marked occupied at slot ${res.slotId}.`,
        category: 'slot',
      }),
    }));

    showToast(`Checked in ${res.vehicleReg} at slot ${res.slotId}`, 'success');
    return { ok: true, message: 'Checked in successfully.' };
  };

  const checkOutSlot = (slotId: string): ActionResult => {
    const slot = state.slots.find((s) => s.id === slotId);
    if (!slot) return { ok: false, message: 'Slot not found.' };
    const zone = PARKING_ZONES.find((z) => z.id === slot.zoneId);
    const nowTime = formatCurrentTime(0);

    const matchingRes = state.reservations.find(
      (r) => r.slotId === slotId && (r.status === 'active' || r.status === 'checked-in')
    );

    const historyEntry: ParkingHistoryEntry | null = slot.vehicleReg
      ? {
          id: `HIS-${Date.now()}`,
          userId: slot.occupantId ?? currentUser?.id ?? 'user-shubham',
          slotId: slot.id,
          zoneName: zone?.name ?? slot.zoneId,
          vehicleReg: slot.vehicleReg,
          vehicleType: slot.vehicleType,
          date: 'Today',
          checkInTime: slot.since ?? nowTime,
          checkOutTime: nowTime,
          durationLabel: matchingRes ? `${matchingRes.durationHours}h slot` : 'Session ended',
          status: 'Completed',
        }
      : null;

    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === slotId
          ? {
              ...s,
              status: 'available',
              vehicleReg: undefined,
              vehicleModel: undefined,
              occupantName: undefined,
              occupantRole: undefined,
              occupantId: undefined,
              department: undefined,
              since: undefined,
              reservedUntil: undefined,
              notes: undefined,
            }
          : s
      ),
      reservations: prev.reservations.map((r) =>
        r.slotId === slotId && (r.status === 'active' || r.status === 'checked-in')
          ? { ...r, status: 'completed', endTime: nowTime }
          : r
      ),
      history: historyEntry ? [historyEntry, ...prev.history] : prev.history,
      notifications: pushNotification(prev.notifications, {
        userId: slot.occupantId ?? currentUser?.id ?? 'all',
        title: `Slot ${slot.id} Released`,
        message: `${slot.vehicleReg ?? 'Vehicle'} exited slot ${slot.id}. Bay is now available.`,
        category: 'slot',
      }),
    }));

    showToast(`Slot ${slot.id} is now available`, 'info');
    return { ok: true, message: 'Slot released.' };
  };

  const cancelReservation = (reservationId: string): ActionResult => {
    const res = state.reservations.find((r) => r.id === reservationId);
    if (!res) return { ok: false, message: 'Reservation not found.' };
    const zone = PARKING_ZONES.find((z) => z.id === res.zoneId);

    const cancelledHistory: ParkingHistoryEntry = {
      id: `HIS-${Date.now()}`,
      userId: res.userId,
      slotId: res.slotId,
      zoneName: zone?.name ?? res.zoneId,
      vehicleReg: res.vehicleReg,
      vehicleType: res.vehicleType,
      date: 'Today',
      checkInTime: res.startTime,
      checkOutTime: formatCurrentTime(0),
      durationLabel: 'Cancelled',
      status: 'Cancelled',
    };

    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.id === res.slotId
          ? {
              ...s,
              status: 'available',
              vehicleReg: undefined,
              vehicleModel: undefined,
              occupantName: undefined,
              occupantRole: undefined,
              occupantId: undefined,
              department: undefined,
              since: undefined,
              reservedUntil: undefined,
              notes: undefined,
            }
          : s
      ),
      reservations: prev.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: 'cancelled' } : r
      ),
      history: [cancelledHistory, ...prev.history],
      notifications: pushNotification(prev.notifications, {
        userId: res.userId,
        title: `Reservation ${res.id} Cancelled`,
        message: `Slot ${res.slotId} has been released back to the campus pool.`,
        category: 'reservation',
      }),
    }));

    showToast(`Cancelled reservation for slot ${res.slotId}`, 'info');
    return { ok: true, message: 'Reservation cancelled.' };
  };

  const addVehicle: ParkingContextValue['addVehicle'] = (vehicle) => {
    if (!currentUser) return { ok: false, message: 'Not signed in.' };
    const cleanReg = vehicle.regNumber.trim().toUpperCase();
    if (!cleanReg || !vehicle.model.trim()) {
      return { ok: false, message: 'Registration number and vehicle model are required.' };
    }
    const exists = currentUser.vehicles.some((v) => v.regNumber.toUpperCase() === cleanReg);
    if (exists) {
      return { ok: false, message: 'This vehicle registration is already in your garage.' };
    }

    const newVehicle: Vehicle = {
      ...vehicle,
      id: `veh-${Date.now()}`,
      regNumber: cleanReg,
      isPrimary: currentUser.vehicles.length === 0 ? true : vehicle.isPrimary,
    };

    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              vehicles: newVehicle.isPrimary
                ? [...u.vehicles.map((v) => ({ ...v, isPrimary: false })), newVehicle]
                : [...u.vehicles, newVehicle],
            }
          : u
      ),
    }));
    showToast(`Added ${cleanReg} to your vehicles`, 'success');
    return { ok: true, message: 'Vehicle added.' };
  };

  const removeVehicle = (vehicleId: string) => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => {
        if (u.id !== currentUser.id) return u;
        const remaining = u.vehicles.filter((v) => v.id !== vehicleId);
        if (remaining.length > 0 && !remaining.some((v) => v.isPrimary)) {
          remaining[0] = { ...remaining[0], isPrimary: true };
        }
        return { ...u, vehicles: remaining };
      }),
    }));
    showToast('Removed vehicle from profile', 'info');
  };

  const setPrimaryVehicle = (vehicleId: string) => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              vehicles: u.vehicles.map((v) => ({
                ...v,
                isPrimary: v.id === vehicleId,
              })),
            }
          : u
      ),
    }));
    showToast('Updated primary vehicle', 'success');
  };

  const updateUserProfile: ParkingContextValue['updateUserProfile'] = (updates) => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              name: updates.name.trim() || u.name,
              department: updates.department.trim() || u.department,
              phone: updates.phone.trim() || u.phone,
            }
          : u
      ),
    }));
    showToast('Profile details saved', 'success');
  };

  const adminUpdateSlotStatus: ParkingContextValue['adminUpdateSlotStatus'] = (
    slotId,
    status,
    details
  ) => {
    const slot = state.slots.find((s) => s.id === slotId);
    if (!slot) return { ok: false, message: 'Slot not found.' };
    const nowTime = formatCurrentTime(0);

    setState((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => {
        if (s.id !== slotId) return s;
        if (status === 'available') {
          return {
            ...s,
            status: 'available',
            vehicleReg: undefined,
            vehicleModel: undefined,
            occupantName: undefined,
            occupantRole: undefined,
            occupantId: undefined,
            department: undefined,
            since: undefined,
            reservedUntil: undefined,
            notes: undefined,
          };
        }
        if (status === 'maintenance') {
          return {
            ...s,
            status: 'maintenance',
            vehicleReg: undefined,
            vehicleModel: undefined,
            occupantName: undefined,
            occupantRole: undefined,
            occupantId: undefined,
            department: undefined,
            since: nowTime,
            reservedUntil: undefined,
            notes: details?.notes?.trim() || 'Closed by Campus Parking Admin for maintenance',
          };
        }
        return {
          ...s,
          status,
          vehicleReg: details?.vehicleReg?.trim().toUpperCase() || s.vehicleReg || 'MP 07 XX 0000',
          vehicleModel: details?.vehicleModel?.trim() || s.vehicleModel || 'Manual Gate Entry',
          occupantName: details?.occupantName?.trim() || s.occupantName || 'Campus Driver',
          occupantRole: details?.occupantRole || s.occupantRole || 'student',
          department: details?.department?.trim() || s.department || 'MITS Campus',
          since: nowTime,
          notes: details?.notes?.trim() || s.notes,
        };
      }),
      reservations:
        status === 'available' || status === 'maintenance'
          ? prev.reservations.map((r) =>
              r.slotId === slotId && (r.status === 'active' || r.status === 'checked-in')
                ? { ...r, status: 'cancelled' }
                : r
            )
          : prev.reservations,
      notifications: pushNotification(prev.notifications, {
        userId: 'all',
        title: `Admin Updated Slot ${slotId}`,
        message: `Slot ${slotId} status changed to ${status}${details?.vehicleReg ? ` (${details.vehicleReg.toUpperCase()})` : ''}.`,
        category: 'admin',
      }),
    }));

    showToast(`Slot ${slotId} set to ${status}`, 'success');
    return { ok: true, message: `Updated slot ${slotId}.` };
  };

  const adminAddSlot: ParkingContextValue['adminAddSlot'] = (
    zoneId,
    vehicleType,
    allowedRoles
  ) => {
    const zoneSlots = state.slots.filter((s) => s.zoneId === zoneId);
    const prefix =
      zoneId === 'zone-admin'
        ? 'A'
        : zoneId === 'zone-academic'
          ? 'B'
          : zoneId === 'zone-library'
            ? 'C'
            : zoneId === 'zone-workshop'
              ? 'D'
              : 'E';
    const maxNum = zoneSlots.reduce((max, s) => {
      const num = parseInt(s.id.split('-')[1] || '0', 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextNum = maxNum + 1;
    const newSlotId = `${prefix}-${String(nextNum).padStart(2, '0')}`;
    const rowBCount = zoneSlots.filter((s) => s.row === 'B').length;
    const rowACount = zoneSlots.filter((s) => s.row === 'A').length;
    const row: 'A' | 'B' = rowACount <= rowBCount ? 'A' : 'B';

    const newSlot: ParkingSlot = {
      id: newSlotId,
      zoneId,
      row,
      indexInRow: (row === 'A' ? rowACount : rowBCount) + 1,
      vehicleType,
      allowedRoles,
      status: 'available',
    };

    setState((prev) => ({
      ...prev,
      slots: [...prev.slots, newSlot],
      notifications: pushNotification(prev.notifications, {
        userId: 'all',
        title: `New Slot ${newSlotId} Added`,
        message: `Admin expanded capacity with bay ${newSlotId} (${vehicleType}).`,
        category: 'admin',
      }),
    }));
    showToast(`Added parking bay ${newSlotId}`, 'success');
    return { ok: true, message: `Added slot ${newSlotId}.` };
  };

  const adminRemoveSlot = (slotId: string): ActionResult => {
    const slot = state.slots.find((s) => s.id === slotId);
    if (!slot) return { ok: false, message: 'Slot not found.' };
    if (slot.status === 'occupied' || slot.status === 'reserved') {
      return { ok: false, message: 'Release or cancel the slot before removing it.' };
    }
    setState((prev) => ({
      ...prev,
      slots: prev.slots.filter((s) => s.id !== slotId),
    }));
    if (selectedSlotId === slotId) setSelectedSlotId(null);
    showToast(`Removed slot ${slotId}`, 'info');
    return { ok: true, message: 'Slot removed.' };
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const resetDemoData = () => {
    const fresh = getDefaultState();
    setState(fresh);
    setSelectedZoneId('zone-academic');
    setSelectedSlotId('B-04');
    showToast('Demo state reset to initial MITS Gwalior dataset', 'info');
  };

  const value: ParkingContextValue = {
    zones: PARKING_ZONES,
    users: state.users,
    currentUser,
    slots: state.slots,
    reservations: state.reservations,
    history: state.history,
    notifications: userNotifications,
    unreadCount,
    activeTab,
    setActiveTab,
    selectedZoneId,
    setSelectedZoneId,
    selectedSlotId,
    setSelectedSlotId,
    authModalOpen,
    setAuthModalOpen,
    toast,
    showToast,
    jumpToSlotOnMap,
    loginAsUser,
    registerDemoUser,
    logout,
    reserveSlot,
    checkInReservation,
    checkOutSlot,
    cancelReservation,
    addVehicle,
    removeVehicle,
    setPrimaryVehicle,
    updateUserProfile,
    adminUpdateSlotStatus,
    adminAddSlot,
    adminRemoveSlot,
    markNotificationRead,
    markAllNotificationsRead,
    resetDemoData,
  };

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
}

export function useParking() {
  const ctx = useContext(ParkingContext);
  if (!ctx) {
    throw new Error('useParking must be used within ParkingProvider');
  }
  return ctx;
}
