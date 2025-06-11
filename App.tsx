
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import ScrapingPage from './pages/ScrapingPage';
import ScrapingIAPage from './pages/ScrapingIAPage';
import ScrapingReviewPage from './pages/ScrapingReviewPage';
import HistoryListPage from './pages/HistoryListPage';
import HistoryDetailPage from './pages/HistoryDetailPage'; 
import ProductScrapingDetailPage from './pages/ProductScrapingDetailPage';
import ProductsPage from './pages/ProductsPage'; // Import ProductsPage
import RetailersPage from './pages/RetailersPage'; 
import MainLayout from './components/layout/MainLayout';
import { NavigationPath } from './types';
import { useTheme } from './contexts/ThemeContext'; 

// Wrapper component para HistoryDetailPage
const HistoryDetailWrapper: React.FC<{ onNavigate: (path: NavigationPath, params?: Record<string, string>) => void }> = ({ onNavigate }) => {
  console.log('🔍 Debug HistoryDetailWrapper - Iniciando');
  
  const params = useParams();
  console.log('🔍 Debug HistoryDetailWrapper - useParams() completo:', params);
  
  const { id } = params as { id: string };
  console.log('🔍 Debug HistoryDetailWrapper - id extraído:', id);
  console.log('🔍 Debug HistoryDetailWrapper - tipo de id:', typeof id);
  
  return <HistoryDetailPage historyEntryId={id || null} onNavigate={onNavigate} />;
};

const AppContent: React.FC = () => {
  const [currentUserType, setCurrentUserType] = useState<string | null>(localStorage.getItem('userType'));
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme(); 

  useEffect(() => {
    if (!currentUserType && location.pathname !== NavigationPath.Login) {
      navigate(NavigationPath.Login, { replace: true });
    } else if (currentUserType && location.pathname === NavigationPath.Login) {
      navigate(NavigationPath.Dashboard, { replace: true });
    }
  }, [currentUserType, location.pathname, navigate]);

  const handleLoginSuccess = (userType: string) => {
    localStorage.setItem('userType', userType);
    setCurrentUserType(userType);
    navigate(NavigationPath.Dashboard);
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    setCurrentUserType(null);
    navigate(NavigationPath.Login);
  };

  const handleNavigation = (path: NavigationPath, params?: Record<string, string>) => {
    console.log('🔍 Debug - Navegando a:', path);
    console.log('🔍 Debug - Con parámetros:', params);
    
    let finalPath = path as string;
    if (params) {
        Object.keys(params).forEach(key => {
            finalPath = finalPath.replace(`:${key}`, encodeURIComponent(params[key]));
        });
    }
    console.log('🔍 Debug - URL final:', finalPath);
    navigate(finalPath);
  };

  if (!currentUserType && location.pathname !== NavigationPath.Login) {
    return <Navigate to={NavigationPath.Login} replace />;
  }
  
  if (location.pathname === NavigationPath.Login) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const getCurrentNavPath = (): NavigationPath => {
    const path = location.pathname;
    
    const productScrapingDetailMatch = path.match(/^\/scraping\/([^/]+)\/([^/]+)$/);
    if (productScrapingDetailMatch) {
        return NavigationPath.Scraping; 
    }
    // Check HistoryDetail first due to specificity
    if (path.match(new RegExp(`^${NavigationPath.HistoryDetail.replace(':id', '[^/]+')}$`))) {
        return NavigationPath.HistoryList;
    }
    if (path.startsWith(NavigationPath.HistoryList)) return NavigationPath.HistoryList;
    if (path === NavigationPath.Products) return NavigationPath.HistoryList; // Highlight Historial for Products page
    if (path.startsWith(NavigationPath.ScrapingIA) || path.startsWith(NavigationPath.ScrapingReview) || path === NavigationPath.Scraping) return NavigationPath.Scraping;
    
    return Object.values(NavigationPath).find(p => p === path) || NavigationPath.Dashboard;
  }

  return (
    <MainLayout
      currentPath={getCurrentNavPath()}
      userType={currentUserType}
      onNavigate={handleNavigation}
      onLogout={handleLogout}
    >
      <Routes>
        <Route path={NavigationPath.Dashboard} element={<DashboardPage />} />
        
        {currentUserType === 'Admin' && (
          <Route path={NavigationPath.Users} element={<UserManagementPage />} />
        )}
        
        <Route 
          path={NavigationPath.Scraping} 
          element={<ScrapingPage 
            onNavigateToScrapingIA={() => handleNavigation(NavigationPath.ScrapingIA)}
            onNavigate={handleNavigation} 
            />} 
        />
        <Route 
          path={NavigationPath.ScrapingIA} 
          element={<ScrapingIAPage 
            onNavigateBack={() => handleNavigation(NavigationPath.Scraping)} 
            />} 
        />
        <Route
          path={NavigationPath.ScrapingReview}
          element={<ScrapingReviewPage
            onNavigateBack={() => handleNavigation(NavigationPath.Scraping)}
            productData={(() => {
              const productDataString = sessionStorage.getItem('scrapingReviewProductData');
              if (productDataString) {
                try {
                  return JSON.parse(productDataString);
                } catch (error) {
                  console.error('Error parsing product data from sessionStorage:', error);
                  return undefined;
                }
              }
              return undefined;
            })()}
            />}
        />
         <Route
          path={NavigationPath.ProductScrapingDetail.replace(':comercio', ':comercioParam').replace(':id_producto', ':productIdParam')}
          element={
            (() => {
              const { comercioParam, productIdParam } = useParams<{ comercioParam: string, productIdParam: string }>();
              if (!comercioParam || !productIdParam) return <Navigate to={NavigationPath.HistoryList} replace />;
              return <ProductScrapingDetailPage
                comercio={decodeURIComponent(comercioParam)}
                productId={productIdParam}
                onNavigate={handleNavigation}
              />;
            })()
          }
        />
        
        {/* HistoryDetail route - usando el wrapper component */}
        <Route 
            path={NavigationPath.HistoryDetail} 
            element={<HistoryDetailWrapper onNavigate={handleNavigation} />}
        />
        <Route path={NavigationPath.HistoryList} element={<HistoryListPage onNavigate={handleNavigation} />} />
        
        <Route 
            path={NavigationPath.Products} 
            element={<ProductsPage onNavigate={handleNavigation} />} 
        />
        
        {(currentUserType === 'Admin' || currentUserType === 'SuperuserAccess') && (
          <Route path={NavigationPath.Retailers} element={<RetailersPage />} />
        )}
        <Route path="*" element={<Navigate to={NavigationPath.Dashboard} replace />} />
      </Routes>
    </MainLayout>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
