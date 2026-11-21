import { useState } from 'react';
import { Bell, CalendarPlus, CheckCheck, Menu } from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { ActiveTab } from '../types/parking';

const TAB_TITLES: Record<ActiveTab, string> = {
  map: 'Campus Parking Map',
  reserve: 'Smart Search & Reservations',
  lookup: 'Vehicle Lookup',
  analytics: 'Occupancy Analytics',
  admin: 'Admin Operations',
  profile: 'Profile & Vehicles',
  project: 'Project Overview',
};

export function TopBar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const {
    activeTab,
    setActiveTab,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useParking();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu + Contextual Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-400 hidden sm:inline whitespace-nowrap">MITS Gwalior</span>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-semibold text-slate-900 truncate">
            {TAB_TITLES[activeTab]}
          </h1>
        </nav>
      </div>

      {/* Right: Notifications + Primary CTA */}
      <div className="flex items-center gap-3 shrink-0 relative">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label="Open notifications"
            className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-700 text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotifOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 z-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-display font-semibold text-sm text-slate-900">
                    Notifications ({unreadCount} unread)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="p-5 text-sm text-slate-500 text-center">No notifications yet.</p>
                  ) : (
                    notifications.slice(0, 8).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => markNotificationRead(item.id)}
                        className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 ${
                          item.read ? 'bg-white' : 'bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                          <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {item.message}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('reserve')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-xs sm:text-sm font-medium hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Quick Reserve</span>
        </button>
      </div>
    </header>
  );
}
