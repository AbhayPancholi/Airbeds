import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import {
  LayoutDashboard,
  Users,
  Home,
  FileText,
  CreditCard,
  Receipt,
  LogOut,
  Bell,
  Shield,
  Menu,
  X,
  Building2,
  User,
  ChevronDown,
  Landmark,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
];

const ownersSection = {
  label: 'Owners',
  icon: Home,
  children: [
    { path: '/owners', label: 'Owner List', icon: Home },
    { path: '/owners/payments', label: 'Payments', icon: CreditCard },
  ],
};

const tenantsSection = {
  label: 'Tenants',
  icon: Users,
  children: [
    { path: '/tenants', label: 'Occupancy Details', icon: Users },
    { path: '/tenants/agreements', label: 'Agreements', icon: FileText },
    { path: '/tenants/notices', label: 'Leave Notices', icon: Bell },
    { path: '/tenants/police-verification', label: 'Police Verification', icon: Shield },
    { path: '/tenants/payments', label: 'Payments', icon: CreditCard },
  ],
};

const profileSection = {
  label: 'Profile',
  icon: User,
  children: [
    { path: '/profile/bank-investments', label: 'Bank & Investments', icon: Landmark },
  ],
};

export const Layout = ({ children }) => {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isOwnersActive = ownersSection.children.some(
    (c) => location.pathname.startsWith(c.path) || location.pathname === c.path
  );
  const isTenantsActive = tenantsSection.children.some(
    (c) => location.pathname.startsWith(c.path) || location.pathname === c.path
  );
  const isProfileActive = profileSection.children.some(
    (c) => location.pathname.startsWith(c.path) || location.pathname === c.path
  );
  const [ownersOpen, setOwnersOpen] = useState(isOwnersActive);
  const [tenantsOpen, setTenantsOpen] = useState(isTenantsActive);
  const [profileOpen, setProfileOpen] = useState(isProfileActive);
  const OwnersIcon = ownersSection.icon;
  const TenantsIcon = tenantsSection.icon;
  const ProfileIcon = profileSection.icon;
  useEffect(() => {
    if (isOwnersActive) setOwnersOpen(true);
    if (isTenantsActive) setTenantsOpen(true);
    if (isProfileActive) setProfileOpen(true);
  }, [isOwnersActive, isTenantsActive, isProfileActive]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-slate-900" />
          <span className="font-bold text-lg text-slate-900">EstateCommand</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-testid="mobile-menu-toggle"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
            <Building2 className="h-7 w-7 text-slate-900" />
            <span className="font-bold text-lg text-slate-900 tracking-tight">EstateCommand</span>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              {/* Owners Section */}
              <Collapsible open={ownersOpen} onOpenChange={setOwnersOpen} className="mt-1">
                <CollapsibleTrigger
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isOwnersActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <OwnersIcon className="h-5 w-5" />
                    {ownersSection.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${ownersOpen ? 'rotate-180' : ''}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-8 pr-2 py-1 space-y-0.5">
                    {ownersSection.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setSidebarOpen(false)}
                          data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`flex items-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive(child.path)
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <ChildIcon className="h-4 w-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
              {/* Tenants Section */}
              <Collapsible open={tenantsOpen} onOpenChange={setTenantsOpen} className="mt-1">
                <CollapsibleTrigger
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isTenantsActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <TenantsIcon className="h-5 w-5" />
                    {tenantsSection.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${tenantsOpen ? 'rotate-180' : ''}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-8 pr-2 py-1 space-y-0.5">
                    {tenantsSection.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setSidebarOpen(false)}
                          data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`flex items-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive(child.path)
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <ChildIcon className="h-4 w-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible open={profileOpen} onOpenChange={setProfileOpen} className="mt-1">
                <CollapsibleTrigger
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isProfileActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <ProfileIcon className="h-5 w-5" />
                    {profileSection.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-8 pr-2 py-1 space-y-0.5">
                    {profileSection.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setSidebarOpen(false)}
                          data-testid={`nav-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`flex items-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive(child.path)
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <ChildIcon className="h-4 w-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </nav>
          </ScrollArea>

          {/* User Section */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-sm font-semibold text-slate-600">
                  {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{admin?.name || 'Admin'}</p>
                <p className="text-xs text-slate-500 truncate">{admin?.email}</p>
              </div>
            </div>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
