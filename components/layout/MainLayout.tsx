
import React from 'react';
import Sidebar from './Sidebar';
import { NavigationPath } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPath: NavigationPath;
  userType: string | null;
  onNavigate: (path: NavigationPath) => void;
  onLogout: () => void;
  // theme?: string; // theme prop can be removed if using useTheme context within child components
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPath, userType, onNavigate, onLogout }) => {
  return (
    // The body tag in index.html handles the outermost background.
    // This div ensures the flex layout for sidebar and main content.
    <div className="flex min-h-screen">
      <Sidebar currentPath={currentPath} userType={userType} onNavigate={onNavigate} onLogout={onLogout} />
      {/* Main content area itself should have its own background set by body or a wrapper if needed */}
      {/* The bg-background on body and dark:bg-slate-800 on html.dark body in index.html handles the page background */}
      <main className="flex-1 ml-64 p-6 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;