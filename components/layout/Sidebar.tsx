
import React from 'react';
import { NavigationPath } from '../../types';
import { DashboardIcon, UsersIcon, ScrapingIcon, HistoryIcon, StoreIcon, LogoutIcon, AdminIcon, SparklesIcon } from '../icons/SidebarIcons';
import { APP_NAME } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

// Placeholder Sun and Moon Icons
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21c3.73 0 7.03-2.034 8.665-5.061a.751.751 0 00-1.062-1.061c-.399.363-.838.68-1.296.952z" />
  </svg>
);


interface SidebarProps {
  currentPath: NavigationPath;
  userType: string | null;
  onNavigate: (path: NavigationPath) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, userType, onNavigate, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const navItems = [
    { path: NavigationPath.Dashboard, label: 'Dashboard', icon: DashboardIcon, adminOnly: false },
    { path: NavigationPath.Users, label: 'Usuarios', icon: UsersIcon, adminOnly: true },
    { path: NavigationPath.Scraping, label: 'Scraping', icon: ScrapingIcon, adminOnly: false },
    { path: NavigationPath.HistoryList, label: 'Historial', icon: HistoryIcon, adminOnly: false },
    { path: NavigationPath.Retailers, label: 'Comercios', icon: StoreIcon, adminOnly: true },
  ];

  const activeUser = userType === 'Admin' ? 'Admin User' : (userType === 'SuperuserAccess' ? 'Superuser' : 'Standard User');

  return (
    <div className="w-64 bg-sidebar text-white flex flex-col h-screen fixed top-0 left-0 shadow-2xl print:hidden">
      <div className="p-5 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-center">{APP_NAME}</h1>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5 text-gray-300" /> : <SunIcon className="w-5 h-5 text-yellow-400" />}
        </button>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {navItems.map(item => {
          if (item.adminOnly && userType !== 'Admin' && userType !== 'SuperuserAccess') {
            return null;
          }
          const isActive = currentPath === item.path || (item.path === NavigationPath.Scraping && currentPath === NavigationPath.ScrapingIA);
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-150
                          ${isActive ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-700 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-5 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <AdminIcon className="w-8 h-8 p-1 bg-primary rounded-full" />
          <div>
            <p className="text-sm font-semibold">{activeUser}</p>
            <p className="text-xs text-gray-400">{userType}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-150 text-gray-300"
        >
          <LogoutIcon className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
        <p className="text-xs text-center text-gray-500 mt-4">
          &copy; {new Date().getFullYear()} Price Tracking.<br/> Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Sidebar;