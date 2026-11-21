import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  Car,
  LogIn,
  Map,
  ShieldCheck,
  UserCircle,
  X,
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { ROLE_LABELS } from '../data/seedData';
import { ActiveTab } from '../types/parking';
import { UserAvatar } from './VehicleIcon';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { activeTab, setActiveTab, currentUser, setAuthModalOpen, reservations } = useParking();

  const myActiveResCount = currentUser
    ? reservations.filter(
        (r) => r.userId === currentUser.id && (r.status === 'active' || r.status === 'checked-in')
      ).length
    : 0;

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: typeof Map;
    meta?: string;
    adminOnly?: boolean;
  }[] = [
    { id: 'map', label: 'Campus Map', icon: Map },
    {
      id: 'reserve',
      label: 'Smart Reserve',
      icon: CalendarCheck,
      meta: myActiveResCount > 0 ? String(myActiveResCount) : undefined,
    },
    { id: 'lookup', label: 'Vehicle Lookup', icon: Car },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'admin', label: 'Admin Monitor', icon: ShieldCheck },
    { id: 'profile', label: 'My Vehicles & Log', icon: UserCircle },
    { id: 'project', label: 'Project Info', icon: BookOpen },
  ];

  const handleNav = (id: ActiveTab) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
        <button
          type="button"
          onClick={() => handleNav('map')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white font-display font-bold text-sm tracking-tight">
            M
          </span>
          <span className="font-display font-bold text-base tracking-tight text-slate-900">
            MITS Parking
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-400'}`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {item.meta && (
                <span className="text-xs font-mono tabular-nums font-semibold text-blue-700">
                  {item.meta}
                </span>
              )}
              {item.id === 'admin' && currentUser?.role !== 'admin' && (
                <span className="text-[11px] text-slate-400 font-normal">Admin</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active Demo Account Switcher */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        {currentUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {ROLE_LABELS[currentUser.role]} · {currentUser.campusId}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthModalOpen(true);
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              Switch Role / Account
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAuthModalOpen(true);
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap"
          >
            <LogIn className="w-4 h-4" />
            Demo Sign In
          </button>
        )}

        <p className="mt-3 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
          Team NeonDrive · MITS Gwalior
          <br />
          Shubham Khare &amp; Sohit Patel
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-xl">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
