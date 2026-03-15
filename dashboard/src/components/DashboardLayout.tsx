import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Globe,
  Compass,
  Palette,
  ShoppingBag,
  PenLine,
  HelpCircle,
  Users,
  Briefcase,
  Star,
  Video,
  ClipboardList,
  Hammer,
  Inbox,
  Image,
  Settings,
  CreditCard,
  Scale,
  Eye,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  children?: { label: string; to: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Website',
    to: '/dashboard/website',
    icon: Globe,
    children: [
      { label: 'Pages', to: '/dashboard/website/pages', icon: FileText },
      { label: 'Navigation', to: '/dashboard/website/navigation', icon: Compass },
      { label: 'Branding', to: '/dashboard/website/branding', icon: Palette },
    ],
  },
  {
    label: 'Content',
    to: '/dashboard/content',
    icon: PenLine,
    children: [
      { label: 'Products', to: '/dashboard/content/products', icon: ShoppingBag },
      { label: 'Blog', to: '/dashboard/content/blog', icon: PenLine },
      { label: 'FAQs', to: '/dashboard/content/faq', icon: HelpCircle },
      { label: 'Team', to: '/dashboard/content/team', icon: Users },
      { label: 'Careers', to: '/dashboard/content/careers', icon: Briefcase },
      { label: 'Testimonials', to: '/dashboard/content/testimonials', icon: Star },
      { label: 'Videos', to: '/dashboard/content/videos', icon: Video },
    ],
  },
  {
    label: 'Forms',
    to: '/dashboard/forms',
    icon: ClipboardList,
    children: [
      { label: 'Builder', to: '/dashboard/forms', icon: Hammer },
      { label: 'Submissions', to: '/dashboard/forms/submissions', icon: Inbox },
    ],
  },
  { label: 'Media', to: '/dashboard/media', icon: Image },
  {
    label: 'Settings',
    to: '/dashboard/settings',
    icon: Settings,
    children: [
      { label: 'Branding', to: '/dashboard/settings/branding', icon: Palette },
      { label: 'Users', to: '/dashboard/settings/users', icon: Users },
      { label: 'Payment', to: '/dashboard/settings/payment', icon: CreditCard },
      { label: 'Legal', to: '/dashboard/settings/legal', icon: Scale },
    ],
  },
  { label: 'Preview', to: '/dashboard/preview', icon: Eye },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/dashboard/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-lg font-bold text-gray-900">BarterPay</span>
          <button
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={clsx(
                      'h-4 w-4 transition-transform',
                      expandedGroups.has(item.label) && 'rotate-180',
                    )}
                  />
                </button>
                {expandedGroups.has(item.label) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100',
                          )
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100',
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
          <button
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:block text-sm text-gray-500">
            {user?.tenant.name}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.fullName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
