export type UserRole = 'student' | 'faculty' | 'admin';

export type VehicleType = 'two-wheeler' | 'car' | 'ev' | 'bicycle' | 'accessible';

export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export type ActiveTab =
  | 'map'
  | 'reserve'
  | 'lookup'
  | 'analytics'
  | 'admin'
  | 'profile'
  | 'project';

export interface Vehicle {
  id: string;
  regNumber: string;
  model: string;
  type: VehicleType;
  color: string;
  isPrimary?: boolean;
}

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  campusId: string;
  department: string;
  phone: string;
  avatarUrl?: string;
  vehicles: Vehicle[];
}

export interface ParkingZone {
  id: string;
  code: string;
  name: string;
  shortName: string;
  landmark: string;
  description: string;
  accessPolicy: string;
  allowedRoles: UserRole[];
  walkingMinutesTo: Record<string, number>;
  mapRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ParkingSlot {
  id: string;
  zoneId: string;
  row: 'A' | 'B';
  indexInRow: number;
  vehicleType: VehicleType;
  allowedRoles: UserRole[];
  status: SlotStatus;
  vehicleReg?: string;
  vehicleModel?: string;
  occupantName?: string;
  occupantRole?: UserRole;
  occupantId?: string;
  department?: string;
  since?: string;
  reservedUntil?: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  slotId: string;
  zoneId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  department: string;
  vehicleReg: string;
  vehicleType: VehicleType;
  createdAt: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: 'active' | 'checked-in' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ParkingHistoryEntry {
  id: string;
  userId: string;
  slotId: string;
  zoneName: string;
  vehicleReg: string;
  vehicleType: VehicleType;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  durationLabel: string;
  status: 'Completed' | 'Cancelled';
}

export interface AppNotification {
  id: string;
  userId: string | 'all';
  title: string;
  message: string;
  timestamp: string;
  category: 'reservation' | 'slot' | 'admin' | 'system';
  read: boolean;
}

export interface HourlyDemandPoint {
  hour: string;
  occupancyPct: number;
  twoWheelers: number;
  cars: number;
}
