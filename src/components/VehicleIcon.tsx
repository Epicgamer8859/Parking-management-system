import { Accessibility, Bike, Car, Footprints, Zap } from 'lucide-react';
import { SlotStatus, VehicleType } from '../types/parking';

export function VehicleIcon({
  type,
  className = 'w-4 h-4',
}: {
  type: VehicleType;
  className?: string;
}) {
  switch (type) {
    case 'two-wheeler':
      return <Bike className={className} aria-hidden="true" />;
    case 'car':
      return <Car className={className} aria-hidden="true" />;
    case 'ev':
      return <Zap className={className} aria-hidden="true" />;
    case 'bicycle':
      return <Footprints className={className} aria-hidden="true" />;
    case 'accessible':
      return <Accessibility className={className} aria-hidden="true" />;
  }
}

export function getStatusMeta(status: SlotStatus): {
  label: string;
  shortLabel: string;
  textColor: string;
  dotColor: string;
  slotBg: string;
  slotBorder: string;
  slotHover: string;
} {
  switch (status) {
    case 'available':
      return {
        label: 'Available',
        shortLabel: 'Open',
        textColor: 'text-emerald-700',
        dotColor: 'bg-emerald-600',
        slotBg: 'bg-emerald-50/70',
        slotBorder: 'border-emerald-300',
        slotHover: 'hover:border-emerald-600 hover:bg-emerald-50',
      };
    case 'occupied':
      return {
        label: 'Occupied',
        shortLabel: 'Full',
        textColor: 'text-rose-700',
        dotColor: 'bg-rose-600',
        slotBg: 'bg-rose-50/75',
        slotBorder: 'border-rose-300',
        slotHover: 'hover:border-rose-500 hover:bg-rose-50',
      };
    case 'reserved':
      return {
        label: 'Reserved',
        shortLabel: 'Held',
        textColor: 'text-amber-700',
        dotColor: 'bg-amber-600',
        slotBg: 'bg-amber-50/80',
        slotBorder: 'border-amber-300',
        slotHover: 'hover:border-amber-500 hover:bg-amber-50',
      };
    case 'maintenance':
      return {
        label: 'Maintenance',
        shortLabel: 'Maint',
        textColor: 'text-slate-600',
        dotColor: 'bg-slate-500',
        slotBg: 'bg-slate-100',
        slotBorder: 'border-slate-300',
        slotHover: 'hover:border-slate-500',
      };
  }
}

export function UserAvatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-base' : 'w-10 h-10 text-sm';

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (avatarUrl) {
    return (
      <div
        className={`${sizeClass} relative shrink-0 overflow-hidden rounded-lg bg-slate-200 border border-slate-200`}
      >
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-lg bg-slate-800 text-white font-semibold flex items-center justify-center`}
    >
      {initials || 'MP'}
    </div>
  );
}
