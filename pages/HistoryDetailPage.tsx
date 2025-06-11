
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/common/Card';
import { NavigationPath, BackendPriceHistory, BackendProduct } from '../types';
import { ChevronLeftIcon, CsvIcon, PdfIcon, ChevronDownIcon } from '../components/icons/SidebarIcons';
import * as apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface HistoryDetailPageProps {
  historyEntryId: string | null; // Ahora será opcional/ignorado
  onNavigate: (path: NavigationPath, params?: Record<string, string>) => void;
}

const HistoryDetailPage: React.FC<HistoryDetailPageProps> = ({ historyEntryId, onNavigate }) => {
  
  console.log('🔍 Debug HistoryDetailPage - historyEntryId recibido:', historyEntryId);
  console.log('🔍 Debug HistoryDetailPage - tipo:', typeof historyEntryId);
  
  // Estados para datos de la API
  const [allProducts, setAllProducts] = useState<BackendProduct[]>([]);
  const [priceLog, setPriceLog] = useState<BackendPriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Cargar todos los productos al inicio
  useEffect(() => {
    console.log('🔍 Debug - Cargando todos los productos');
    
    const fetchAllProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const products = await apiService.getProductos();
        console.log('🔍 Debug - Productos cargados:', products.length);
        setAllProducts(products);
        
        // Si hay un historyEntryId específico, seleccionarlo por defecto
        if (historyEntryId && products.length > 0) {
          const foundProduct = products.find(p => p.id_producto.toString() === historyEntryId);
          if (foundProduct) {
            setSelectedProductId(historyEntryId);
            console.log('🔍 Debug - Producto preseleccionado:', foundProduct.nombre);
          }
        }
        
      } catch (err: any) {
        setError(err.message || "Error al cargar productos.");
        console.error('🔍 Debug - Error cargando productos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProducts();
  }, [historyEntryId]);

  // Cargar historial de precios cuando se selecciona un producto
  useEffect(() => {
    if (!selectedProductId) {
      setPriceLog([]);
      setSelectedDate('');
      return;
    }

    console.log('🔍 Debug - Cargando historial para producto:', selectedProductId);
    
    const fetchPriceHistory = async () => {
      try {
        const history = await apiService.getHistorialPrecios({ id_producto: selectedProductId });
        console.log('🔍 Debug - Historial cargado:', history.length, 'entradas');
        setPriceLog(history.sort((a,b) => new Date(b.capturado_en).getTime() - new Date(a.capturado_en).getTime()));
        
        // Resetear fecha seleccionada y variante
        setSelectedDate('');
        setSelectedVariant('');
        
      } catch (err: any) {
        console.error('🔍 Debug - Error cargando historial:', err);
        setPriceLog([]);
      }
    };

    fetchPriceHistory();
  }, [selectedProductId]);

  // Producto seleccionado actual
  const selectedProduct = useMemo(() => {
    return allProducts.find(p => p.id_producto.toString() === selectedProductId) || null;
  }, [allProducts, selectedProductId]);

  // Opciones de variantes para el producto seleccionado
  const variantOptions = useMemo(() => {
    if (!selectedProduct) return [];
    
    const variants = [];
    if (selectedProduct.volumen_ml) {
      variants.push(`${selectedProduct.volumen_ml}ml`);
      if (selectedProduct.volumen_ml >= 1000) {
        variants.push(`${(selectedProduct.volumen_ml / 1000).toFixed(1)}L`);
      }
    }
    return variants;
  }, [selectedProduct]);

  // Opciones de fechas basadas en el historial del producto seleccionado
  const dateOptions = useMemo(() => {
    if (priceLog.length === 0) return [];
    const uniqueDates = Array.from(new Set<string>(
      priceLog.map(p => new Date(p.capturado_en).toLocaleDateString('es-MX', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }))
    )).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/').map(Number);
      const [dayB, monthB, yearB] = b.split('/').map(Number);
      return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime();
    });
    return uniqueDates;
  }, [priceLog]);

  // Resultados filtrados
  const filteredResults = useMemo(() => {
    let results = priceLog;
    
    // Filtrar por fecha si está seleccionada
    if (selectedDate) {
      results = results.filter(item => {
        const itemDate = new Date(item.capturado_en).toLocaleDateString('es-MX', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
        return itemDate === selectedDate;
      });
    }
    
    console.log('🔍 Debug - Resultados filtrados:', results.length);
    return results;
  }, [priceLog, selectedDate]);

  const handleProductChange = (productId: string) => {
    console.log('🔍 Debug - Producto seleccionado:', productId);
    setSelectedProductId(productId);
  };

  const handleGenerateCSV = () => {
    if (!selectedProduct || filteredResults.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const csvData = [
      ["UPC", "SKU", "Precio", "Moneda", "Etiqueta Promo", "Fecha y Hora Captura"],
      ...filteredResults.map(item => [
        selectedProduct.upc || 'N/A',
        selectedProduct.sku || 'N/A',
        item.precio.toFixed(2),
        item.moneda,
        item.etiqueta_promo || '-',
        new Date(item.capturado_en).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
      ])
    ];
    const csvContent = csvData.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historial_precios_${selectedProduct.nombre.replace(/\s/g, '_')}_${selectedDate.replace(/\//g,'-') || 'todas_fechas'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    console.log('Generando CSV...', filteredResults);
  };

  const handleGeneratePDF = () => {
    alert('La generación de PDF no está implementada aún.');
    console.log('Generando PDF...', filteredResults);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => onNavigate(NavigationPath.HistoryList)}
          className="flex items-center text-sm text-primary dark:text-primary-light hover:underline mb-4"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Volver al Historial
        </button>
        <Card className="p-6 text-center dark:bg-slate-700">
          <p className="text-textMuted dark:text-slate-400">
            {error}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center">
              <button
                onClick={() => onNavigate(NavigationPath.HistoryList)}
                aria-label="Volver"
                className="mr-3 p-1 text-textMuted dark:text-slate-400 hover:text-textHeader dark:hover:text-slate-200 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-textHeader dark:text-slate-100">
                Historial Web Scraping {selectedProduct ? selectedProduct.nombre_tienda : 'Todos los Comercios'}
              </h2>
            </div>
            <div className="flex space-x-3 mt-3 sm:mt-0">
              <button
                onClick={handleGenerateCSV}
                disabled={!selectedProduct || filteredResults.length === 0}
                className="flex items-center px-4 py-2 bg-green-custom hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md shadow-sm transition-colors"
              >
                <CsvIcon className="w-4 h-4 mr-2"/> Generar CSV
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={!selectedProduct || filteredResults.length === 0}
                className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md shadow-sm transition-colors"
              >
                 <PdfIcon className="w-4 h-4 mr-2"/> Generar PDF
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Selector de Producto */}
            <div>
              <label htmlFor="product-select" className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                Selecciona el Producto
              </label>
              <div className="relative">
                <select
                  id="product-select"
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="appearance-none mt-1 block w-full p-2.5 border border-input-border dark:border-slate-500 bg-card dark:bg-slate-600 rounded-md text-sm text-textHeader dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-input-focus-ring dark:focus:ring-primary"
                >
                  <option value="">Selecciona un producto...</option>
                  {allProducts.map(product => (
                    <option key={product.id_producto} value={product.id_producto.toString()}>
                      {product.nombre} - {product.nombre_tienda}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-textMuted dark:text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 mt-0.5 pointer-events-none"/>
              </div>
            </div>

            {/* Selector de Variante */}
            <div>
              <label htmlFor="variant-select" className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                Selecciona la variante
              </label>
              <div className="relative">
                <select
                  id="variant-select"
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  disabled={!selectedProduct}
                  className="appearance-none mt-1 block w-full p-2.5 border border-input-border dark:border-slate-500 bg-card dark:bg-slate-600 rounded-md text-sm text-textHeader dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-input-focus-ring dark:focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                >
                  <option value="">Todas las variantes</option>
                  {variantOptions.map(variant => (
                    <option key={variant} value={variant}>
                      {variant}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-textMuted dark:text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 mt-0.5 pointer-events-none"/>
              </div>
            </div>
            
            {/* Selector de Fecha */}
            <div>
              <label htmlFor="date-select-detail" className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                Selecciona la Fecha
              </label>
              <div className="relative">
                <select
                  id="date-select-detail"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={!selectedProduct}
                  className="appearance-none mt-1 block w-full p-2.5 border border-input-border dark:border-slate-500 bg-card dark:bg-slate-600 rounded-md text-sm text-textHeader dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-input-focus-ring dark:focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                >
                  <option value="">Todas las fechas</option>
                  {dateOptions.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-textMuted dark:text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 mt-0.5 pointer-events-none"/>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card>
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-medium text-textHeader dark:text-slate-100 mb-4">
            Resultados del Historial de Precios:
          </h3>
          
          {!selectedProduct ? (
            <div className="text-center py-8">
              <p className="text-textMuted dark:text-slate-400">
                Selecciona un producto para ver su historial de precios.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-slate-600">
                  <tr className="border-b border-contentBorder dark:border-slate-600">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">UPC</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">Moneda</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">Promo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">Fecha y hora</th>
                  </tr>
                </thead>
                <tbody className="bg-card dark:bg-slate-700 divide-y divide-contentBorder dark:divide-slate-600">
                  {filteredResults.map((item) => (
                    <tr key={item.id_precio} className="hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                      <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100 font-mono">
                        {selectedProduct.upc || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100 font-mono">
                        {selectedProduct.sku || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100 font-medium">
                        {item.precio.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted dark:text-slate-300">
                        {item.moneda}
                      </td>
                       <td className="px-4 py-3 text-sm text-textMuted dark:text-slate-300">
                        {item.etiqueta_promo || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-textMuted dark:text-slate-400">
                        {new Date(item.capturado_en).toLocaleString('es-MX', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>
                    </tr>
                  ))}
                  {filteredResults.length === 0 && selectedProduct && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-textMuted dark:text-slate-400">
                        {selectedDate ? 'No se encontraron resultados para la fecha seleccionada.' : 'No hay historial de precios para este producto.'}
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

export default HistoryDetailPage;
