import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/common/Card';
import { EyeIcon, ChevronLeftIcon } from '../components/icons/SidebarIcons'; // Corrected EyeIcon import
import { ScrapingHistoryEntry, NavigationPath } from '../types';
import * as apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface HistoryListPageProps {
  onNavigate: (path: NavigationPath, params?: Record<string, string>) => void;
}

const HistoryListPage: React.FC<HistoryListPageProps> = ({ onNavigate }) => {
  const [historyData, setHistoryData] = useState<ScrapingHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // For client-side filtering for now

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getScrapingHistoryList(); 
      setHistoryData(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar el historial");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);


  const filteredData = useMemo(() =>
    historyData.filter(item =>
      item.comercio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.upc && item.upc.includes(searchTerm)) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      `MXN ${item.precio.toFixed(2)}`.toLowerCase().includes(searchTerm.toLowerCase())
  ), [searchTerm, historyData]);

  const handleNavigateToHistoryDetail = (item: ScrapingHistoryEntry) => {
  console.log('🔍 Debug - Item completo:', item);
  console.log('🔍 Debug - id_producto:', item.id_producto);
  console.log('🔍 Debug - tipo de id_producto:', typeof item.id_producto);
  
  onNavigate(NavigationPath.HistoryDetail, { 
    id: String(item.id_producto) 
  });
};
  
  const handleGoBack = () => {
    // Try to go back in history, or navigate to dashboard as a fallback
    if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate(NavigationPath.Dashboard);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                aria-label="Volver"
                className="mr-3 p-1 text-textMuted dark:text-slate-400 hover:text-textHeader dark:hover:text-slate-200 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-textHeader dark:text-slate-100">Historial Web Scraping</h2>
            </div>
            <div className="mt-3 sm:mt-0">
              <button
                onClick={() => onNavigate(NavigationPath.Products)}
                className="px-4 py-2 bg-blue-custom hover:bg-opacity-90 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-custom dark:focus:ring-offset-slate-800"
              >
                📋 Ver Lista de Productos
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 sm:p-6">
          <div className="w-full max-w-sm">
            <label htmlFor="search" className="block text-sm font-medium text-textMuted dark:text-slate-300 mb-2">
              Buscar (en resultados cargados)
            </label>
            <input
                type="text"
                id="search"
                placeholder="Filtrar por comercio, producto, UPC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full p-2.5 border border-input-border dark:border-slate-500 bg-card dark:bg-slate-600 rounded-md text-sm text-textHeader dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-input-focus-ring dark:focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 sm:p-6">
        {isLoading && (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {error && (
            <div className="text-center py-10 text-red-500 dark:text-red-400">
              <p>Error: {error}</p>
              <button onClick={fetchHistory} className="mt-2 px-3 py-1 bg-primary text-white rounded-md text-sm">Reintentar</button>
            </div>
          )}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-slate-600">
                  <tr className="border-b border-contentBorder dark:border-slate-600">
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Comercio</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Categoría</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Producto</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">UPC</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Precio</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Fecha y hora</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-primary">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-card dark:bg-slate-700 divide-y divide-contentBorder dark:divide-slate-600">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">{item.comercio}</td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">{item.categoria}</td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">{item.producto}</td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">{item.upc || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">{item.sku || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">MXN {item.precio.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-textMuted dark:text-slate-400">{item.fechaHora}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleNavigateToHistoryDetail(item)}
                            className="text-primary hover:text-opacity-80 transition-colors"
                            title={`Ver detalle del historial: ${item.producto}`}
                            aria-label={`Ver detalle del historial: ${item.producto}`}
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-textMuted dark:text-slate-400">
                        No se encontraron registros que coincidan con tu búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HistoryListPage;