
import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import Card from '../components/common/Card';
// ApiDiagnostic import removed
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BackendProduct, RetailerInfo, BackendPriceHistory } from '../types';
import { ChevronDownIcon } from '../components/icons/SidebarIcons';
import { useTheme } from '../contexts/ThemeContext';
import * as apiService from '../services/apiService';

const DashboardPage = (): React.ReactElement => {
  const { theme } = useTheme();
  
  // Estados para datos reales
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [retailers, setRetailers] = useState<RetailerInfo[]>([]);
  const [priceHistory, setPriceHistory] = useState<BackendPriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para UI
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState<'Día' | 'Semana' | 'Mes' | 'Año'>('Mes');

  const chartTickColor = theme === 'dark' ? '#a3a3a3' : '#718096';
  const chartGridColor = theme === 'dark' ? '#525252' : '#E2E8F0';
  const legendColor = theme === 'dark' ? '#e5e5e5' : '#1A202C';
  const tooltipBg = theme === 'dark' ? '#404040' : '#FFFFFF';
  const tooltipBorder = theme === 'dark' ? '#525252' : '#E2E8F0';

  // Cargar datos reales de la API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('[Dashboard] Cargando datos reales...');
        
        const [productsData, retailersData, historyData] = await Promise.all([
          apiService.getProductos(),
          apiService.getTiendas(),
          apiService.getAllHistorialPrecios(2000)
        ]);

        console.log('[Dashboard] Datos cargados:', {
          productos: productsData.length,
          retailers: retailersData.length,
          historial: historyData.length
        });

        setProducts(productsData);
        setRetailers(retailersData);
        setPriceHistory(historyData);

        if (productsData.length > 0) {
          const uniqueProductNames = [...new Set(productsData.map(p => p.nombre))];
          
          const targetProductPattern1 = "Refresco Coca Cola 12 botellas de 355 ml c/u";
          const targetProductPattern2 = "Refresco Coca Cola sin azúcar 12 botellas de 355 ml c/u";
          const targetProductPattern3 = "Coca Cola 12 botellas de 355 ml"; 

          let defaultProduct = uniqueProductNames.find(
            name => name.toLowerCase() === targetProductPattern1.toLowerCase() ||
                    name.toLowerCase() === targetProductPattern2.toLowerCase() ||
                    name.toLowerCase() === targetProductPattern3.toLowerCase()
          );

          if (!defaultProduct) {
             defaultProduct = uniqueProductNames.find(
                name => name.toLowerCase().includes('coca-cola') &&
                        name.toLowerCase().includes('12') && 
                        (name.toLowerCase().includes('355 ml') || name.toLowerCase().includes('355ml'))
             );
          }
          
          if (defaultProduct) {
            setSelectedProductName(defaultProduct);
          } else if (uniqueProductNames.length > 0) {
            setSelectedProductName(uniqueProductNames[0]); 
          }
        }
        
        if (retailersData.length > 0) {
          setSelectedRetailers(retailersData.map(r => r.name));
        }

      } catch (err: any) {
        console.error('[Dashboard] Error cargando datos:', err);
        setError(err.message || 'Error al cargar datos del dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRetailerChange = (retailerName: string) => {
    setSelectedRetailers(prev =>
      prev.includes(retailerName)
        ? prev.filter(r => r !== retailerName)
        : [...prev, retailerName]
    );
  };

  const productOptions = useMemo(() => {
    const productNameCounts = new Map<string, BackendProduct[]>();
    products.forEach(product => {
      if (!productNameCounts.has(product.nombre)) {
        productNameCounts.set(product.nombre, []);
      }
      productNameCounts.get(product.nombre)!.push(product);
    });
    return Array.from(productNameCounts.entries()).map(([productName, productList]) => ({
      name: productName,
      storeCount: new Set(productList.map(p => p.nombre_tienda)).size,
      stores: [...new Set(productList.map(p => p.nombre_tienda))].join(', ')
    }));
  }, [products]);

  const availableRetailersForProduct = useMemo(() => {
    if (!selectedProductName) return retailers.map(r => r.name);
    const productVariants = products.filter(p => p.nombre === selectedProductName);
    return [...new Set(productVariants.map(p => p.nombre_tienda))];
  }, [products, selectedProductName, retailers]);

  const selectedProductVariants = useMemo(() => {
    if (!selectedProductName) return [];
    return products.filter(p => 
      p.nombre === selectedProductName && 
      selectedRetailers.includes(p.nombre_tienda) &&
      availableRetailersForProduct.includes(p.nombre_tienda)
    );
  }, [products, selectedProductName, selectedRetailers, availableRetailersForProduct]);

  const tableData = useMemo(() => {
    if (!selectedProductName || selectedProductVariants.length === 0) return [];
    const latestPricesByStore = new Map<string, {
      comercio: string;
      producto: string;
      precio: number;
      fechaHora: string;
    }>();
    
    selectedProductVariants.forEach(productVariant => {
      const productHistory = priceHistory.filter(h => h.id_producto === productVariant.id_producto);
      if (productHistory.length > 0) {
        const latestPrice = productHistory.sort((a, b) => 
          new Date(b.capturado_en).getTime() - new Date(a.capturado_en).getTime()
        )[0];
        latestPricesByStore.set(productVariant.nombre_tienda, {
          comercio: productVariant.nombre_tienda,
          producto: productVariant.nombre,
          precio: latestPrice.precio,
          fechaHora: new Date(latestPrice.capturado_en).toLocaleString('es-MX', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true 
          })
        });
      }
    });
    return Array.from(latestPricesByStore.values());
  }, [selectedProductName, selectedProductVariants, priceHistory]);

  const barChartData = useMemo(() => {
    return tableData.map(item => ({
      store: item.comercio,
      price: item.precio
    })).sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  }, [tableData]);

  const lineChartData = useMemo(() => {
    if (!selectedProductName || selectedProductVariants.length === 0) return [];
    const allHistoryForProduct: (BackendPriceHistory & { storeName: string })[] = [];
    selectedProductVariants.forEach(productVariant => {
      const productHistory = priceHistory.filter(h => h.id_producto === productVariant.id_producto);
      productHistory.forEach(historyEntry => {
        allHistoryForProduct.push({ ...historyEntry, storeName: productVariant.nombre_tienda });
      });
    });

    const dateDataMap = new Map<string, { name: string; [store: string]: number | string | undefined }>();
    const retailersForChart = selectedRetailers.filter(rName => availableRetailersForProduct.includes(rName));

    allHistoryForProduct.forEach(historyEntry => {
      const date = new Date(historyEntry.capturado_en);
      let dateKey: string, sortableKey: string;
      switch (timePeriod) {
        case 'Día':
          dateKey = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
          sortableKey = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'Semana':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1); // Assuming week starts on Monday
          dateKey = `Sem ${weekStart.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`;
          sortableKey = `${weekStart.getFullYear()}${String(weekStart.getMonth() + 1).padStart(2, '0')}${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        case 'Año':
          dateKey = date.getFullYear().toString();
          sortableKey = date.getFullYear().toString();
          break;
        case 'Mes': default:
          dateKey = date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
          sortableKey = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      const storeName = historyEntry.storeName;
      if (!dateDataMap.has(sortableKey)) {
        const newEntry: { name: string; sortableKey: string; [store: string]: number | string | undefined } = { name: dateKey, sortableKey };
        retailersForChart.forEach(retailer => { newEntry[retailer] = undefined; });
        dateDataMap.set(sortableKey, newEntry);
      }
      const entry = dateDataMap.get(sortableKey)!;
      if (retailersForChart.includes(storeName)) {
        if (entry[storeName] !== undefined) {
          entry[storeName] = ((entry[storeName] as number) + historyEntry.precio) / 2;
        } else {
          entry[storeName] = historyEntry.precio;
        }
      }
    });

    const chartData = Array.from(dateDataMap.values())
      .sort((a, b) => (a.sortableKey as string).localeCompare(b.sortableKey as string))
      .map(({ sortableKey, ...rest }) => rest);
    
    const maxPoints = timePeriod === 'Día' ? 30 : timePeriod === 'Semana' ? 26 : timePeriod === 'Mes' ? 24 : 10;
    return chartData.slice(-maxPoints);
  }, [selectedProductName, selectedProductVariants, priceHistory, selectedRetailers, timePeriod, availableRetailersForProduct]);

  const lineChartRetailerColors: { [key: string]: string } = {
    "Walmart": "#8B5CF6", "Walmart México": "#8B5CF6", "Walmart Super/Express": "#8B5CF6",
    "Bodega Aurrera": "#A0AEC0", "Soriana": "#CBD5E0",
  };
  const defaultLineColor = '#088395';
  const barChartFillColor = theme === 'dark' ? '#c4b5fd' : '#A78BFA';

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold text-textHeader dark:text-slate-100 mb-4">Dashboard</h2>
        <Card className="p-6"><div className="flex justify-center items-center py-20"><LoadingSpinner size="lg" /><span className="ml-3 text-textMuted dark:text-slate-300">Cargando datos reales...</span></div></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold text-textHeader dark:text-slate-100 mb-4">Dashboard</h2>
        <Card className="p-6"><div className="text-center py-10 text-red-500 dark:text-red-400"><p>Error: {error}</p><button onClick={() => window.location.reload()} className="mt-2 px-3 py-1 bg-primary text-white rounded-md text-sm">Reintentar</button></div></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-textHeader dark:text-slate-100">Dashboard - Comparación entre Comercios</h2>
        <button onClick={() => { console.log('Debug data:', { selectedProductName, availableRetailersForProduct, selectedRetailers, selectedProductVariants, tableData, lineChartData, barChartData }); alert('Dashboard debug info logged to console.'); }} className="px-3 py-2 bg-amber-500 text-white text-xs rounded-md hover:bg-amber-600">Debug</button>
      </div>
      
      <Card className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lado izquierdo: Producto + Info Card (5 columnas) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative">
              <label htmlFor="productSelect" className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                Seleccionar Producto ({productOptions.length} disponibles)
              </label>
              <select 
                id="productSelect" 
                value={selectedProductName} 
                onChange={(e) => setSelectedProductName(e.target.value)} 
                disabled={productOptions.length === 0} 
                className="appearance-none mt-1 block w-full py-2.5 px-3 border border-input-border dark:border-slate-500 bg-card dark:bg-slate-600 rounded-lg text-sm text-textHeader dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-slate-500 transition-all"
                aria-label="Seleccionar producto"
              >
                {productOptions.length === 0 && <option value="" disabled>No hay productos</option>}
                {productOptions.map(option => (
                  <option key={option.name} value={option.name}>
                    {option.name} ({option.storeCount} tiendas)
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="w-4 h-4 text-textMuted dark:text-slate-400 absolute right-3 top-1/2 mt-0.5 pointer-events-none"/>
            </div>
            
            {/* Card de información del producto */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-5 border border-blue-100 dark:border-slate-600">
              {selectedProductName ? (
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-20 h-20 bg-white dark:bg-slate-600 rounded-lg border border-blue-200 dark:border-slate-500 flex items-center justify-center shadow-sm" aria-hidden="true">
                      <svg className="w-8 h-8 text-blue-400 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-tight mb-2 truncate" title={selectedProductName}>
                        {selectedProductName}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white dark:bg-slate-600 rounded-lg p-2 text-center border border-blue-100 dark:border-slate-500">
                          <div className="text-blue-600 dark:text-blue-400 font-semibold">
                            {availableRetailersForProduct.length}
                          </div>
                          <div className="text-gray-600 dark:text-slate-300">Tiendas</div>
                        </div>
                        <div className="bg-white dark:bg-slate-600 rounded-lg p-2 text-center border border-blue-100 dark:border-slate-500">
                          <div className="text-green-600 dark:text-green-400 font-semibold">
                            {tableData.length > 0 ? `MXN $${Math.min(...tableData.map(item => item.precio)).toFixed(2)}` : '--'}
                          </div>
                          <div className="text-gray-600 dark:text-slate-300">Menor precio</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-blue-200 dark:border-slate-600">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 dark:text-slate-300">Disponibilidad:</span>
                      <span className="font-medium text-gray-800 dark:text-slate-100">
                        {availableRetailersForProduct.length} de {retailers.length} tiendas
                      </span>
                    </div>
                    {tableData.length > 1 && (
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-gray-600 dark:text-slate-300">Diferencia de precio:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          MXN ${(Math.max(...tableData.map(item => item.precio)) - Math.min(...tableData.map(item => item.precio))).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-3" aria-hidden="true">
                    <svg className="w-8 h-8 text-blue-400 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 font-medium">Selecciona un producto</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">para ver su información detallada</p>
                </div>
              )}
            </div>
          </div>

          {/* Centro: Selección de tiendas (4 columnas) */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
              Comercios Disponibles ({retailers.length})
            </label>
            {selectedProductName && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-slate-700 rounded-lg border border-blue-200 dark:border-slate-600">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Este producto está disponible en:</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed" role="status">
                  {availableRetailersForProduct.length > 0 
                    ? availableRetailersForProduct.join(' • ') 
                    : 'Ninguna tienda listada actualmente.'
                  }
                </p>
              </div>
            )}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1"> {/* Increased max-h and added pr-1 for scrollbar */}
              {retailers.map(retailer => {
                const isAvailable = availableRetailersForProduct.includes(retailer.name);
                const isDisabled = Boolean(selectedProductName && !isAvailable);
                return (
                  <label 
                    key={retailer.id} 
                    className={`flex items-center p-2 rounded-lg border transition-all ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600' 
                        : selectedRetailers.includes(retailer.name)
                          ? 'cursor-pointer bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 ring-1 ring-blue-500 dark:ring-blue-600'
                          : 'cursor-pointer bg-white dark:bg-slate-600 border-gray-200 dark:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-500'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 dark:border-slate-500 rounded focus:ring-blue-500 dark:bg-slate-600 dark:checked:bg-blue-600" 
                      checked={selectedRetailers.includes(retailer.name)} 
                      onChange={() => handleRetailerChange(retailer.name)} 
                      disabled={isDisabled}
                      aria-labelledby={`retailer-name-${retailer.id}`}
                    />
                    <span 
                      id={`retailer-name-${retailer.id}`}
                      className={`ml-3 text-sm font-medium flex-1 ${
                        isDisabled 
                          ? 'text-gray-400 dark:text-gray-500' 
                          : 'text-textHeader dark:text-slate-200'
                      }`}
                    >
                      {retailer.name}
                    </span>
                    {selectedProductName && isAvailable && (
                      <span className="ml-2 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium" aria-label="Disponible">
                        ✓
                      </span>
                    )}
                  </label>
                );
              })}
              {retailers.length === 0 && (
                <p className="text-xs text-textMuted dark:text-slate-400 text-center py-4">No hay comercios disponibles</p>
              )}
            </div>
          </div>

          {/* Lado derecho: Tipo de análisis + Acciones (3 columnas) */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <label htmlFor="analysisType" className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                Tipo de Análisis
              </label>
              <select 
                id="analysisType" 
                disabled 
                className="mt-1 block w-full py-2.5 px-3 border border-input-border dark:border-slate-500 bg-gray-100 dark:bg-slate-600 rounded-lg text-sm text-textMuted dark:text-slate-400 cursor-not-allowed focus:outline-none"
                aria-label="Tipo de análisis"
              >
                <option>Comparación entre comercios</option>
              </select>
            </div>
            
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-3">Acciones Rápidas</h4>
              <div className="space-y-2">
                <button 
                  className="w-full text-left text-xs py-2 px-3 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-md hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors text-gray-700 dark:text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setSelectedRetailers(availableRetailersForProduct)}
                  disabled={!selectedProductName || availableRetailersForProduct.length === 0}
                  aria-label="Seleccionar todas las tiendas disponibles para este producto"
                >
                  🏪 Seleccionar tiendas disponibles
                </button>
                <button 
                  className="w-full text-left text-xs py-2 px-3 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-md hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors text-gray-700 dark:text-slate-300"
                  onClick={() => setSelectedRetailers([])}
                  aria-label="Deseleccionar todas las tiendas"
                >
                  🚫 Deseleccionar todas
                </button>
                <button 
                  className="w-full text-left text-xs py-2 px-3 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-md hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors text-gray-700 dark:text-slate-300"
                  onClick={() => window.location.reload()}
                  aria-label="Actualizar datos de la página"
                >
                  🔄 Actualizar datos
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-textHeader dark:text-slate-100 mb-4">Precios Actuales: {selectedProductName || "Selecciona producto"}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead><tr className="border-b border-contentBorder dark:border-slate-600"><th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">Comercio</th><th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">Producto</th><th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider w-[120px]">Precio</th><th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">Fecha y hora</th></tr></thead>
            <tbody className="bg-card dark:bg-slate-700 divide-y divide-contentBorder dark:divide-slate-600">
              {tableData.map((item, index) => (<tr key={`${item.comercio}-${index}`} className="hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"><td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-textHeader dark:text-slate-100">{item.comercio}</td><td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted dark:text-slate-300">{item.producto}</td><td className="px-5 py-4 whitespace-nowrap text-sm text-textHeader dark:text-slate-100 text-right w-[120px]">MXN ${item.precio.toFixed(2)}</td><td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted dark:text-slate-400">{item.fechaHora}</td></tr>))}
              {tableData.length === 0 && (<tr><td colSpan={4} className="text-center py-8 text-textMuted dark:text-slate-400">{selectedProductName ? `No hay datos de precios para "${selectedProductName}" en las tiendas seleccionadas.` : 'Selecciona un producto para ver la comparación.'}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-6 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h3 className="text-lg font-semibold text-textHeader dark:text-slate-100 mb-2 sm:mb-0">Historial: {selectedProductName || "Selecciona producto"}</h3>
            <div className="flex space-x-1 sm:space-x-2">
              {(['Día', 'Semana', 'Mes', 'Año'] as const).map(period => (<button key={period} onClick={() => setTimePeriod(period)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors duration-150 ${timePeriod === period ? 'bg-blue-custom text-white border-blue-custom' : 'bg-card dark:bg-slate-600 text-textMuted dark:text-slate-300 border-contentBorder dark:border-slate-500 hover:bg-gray-100 dark:hover:bg-slate-500'}`}>{period}</button>))}
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            {lineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartTickColor }} axisLine={{stroke: chartGridColor}} tickLine={{stroke: chartGridColor}} />
                  <YAxis tick={{ fontSize: 12, fill: chartTickColor }} axisLine={{stroke: chartGridColor}} tickLine={{stroke: chartGridColor}} domain={['auto', 'auto']}/>
                  <Tooltip wrapperStyle={{ outline: 'none'}} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '0.5rem', fontSize: 13 }} labelStyle={{ color: legendColor, fontWeight: '600' }} itemStyle={{color: chartTickColor}} />
                  <Legend wrapperStyle={{fontSize: "13px", color: legendColor}}/>
                  {selectedRetailers
                    .filter(retailerName => availableRetailersForProduct.includes(retailerName))
                    .map(retailer => (
                    <Line key={retailer} type="monotone" dataKey={retailer} stroke={lineChartRetailerColors[retailer] || defaultLineColor} strokeWidth={2.5} dot={{ r: 4, fill: lineChartRetailerColors[retailer] || defaultLineColor, strokeWidth: 0 }} activeDot={{ r: 6, fill: lineChartRetailerColors[retailer] || defaultLineColor, stroke: tooltipBg, strokeWidth: 2 }} connectNulls={true} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (<div className="flex items-center justify-center h-full text-textMuted dark:text-slate-400">{selectedProductName && selectedRetailers.length > 0 ? 'No hay datos históricos para la combinación actual.' : 'Seleccione producto y comercios.'}</div>)}
          </div>
        </Card>
        
        <Card className="p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-textHeader dark:text-slate-100 truncate max-w-[70%] mb-1">{selectedProductName || 'Selecciona producto'}</h3>
          <p className="text-sm text-textMuted dark:text-slate-400 mb-4">Precio actual por comercio</p>
          <div className="flex-1 min-h-[300px]">
           {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} margin={{ top: 20, right: 5, left: -25, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} strokeOpacity={0.5} vertical={false}/>
                <XAxis dataKey="store" tick={{ fontSize: 11, fill: chartTickColor }} interval={0} angle={-35} textAnchor="end" height={60} axisLine={{stroke: chartGridColor}} tickLine={{stroke: chartGridColor}}/>
                <YAxis tick={{ fontSize: 12, fill: chartTickColor }} axisLine={{stroke: chartGridColor}} tickLine={{stroke: chartGridColor}} domain={['auto', 'auto']}/>
                <Tooltip wrapperStyle={{ outline: 'none'}} contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '0.5rem', fontSize: 13 }} labelStyle={{ color: legendColor, fontWeight: '600' }} />
                <Bar dataKey="price" fill={barChartFillColor} radius={[6, 6, 0, 0]} barSize={Math.max(10, 200 / Math.max(1, barChartData.length))}>
                  <LabelList dataKey="price" position="top" formatter={(v: number) => `$${v.toFixed(2)}`} style={{ fill: legendColor, fontWeight: 600, fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            ) : (<div className="flex items-center justify-center h-full text-textMuted dark:text-slate-400">{selectedProductName ? 'No hay datos de precios para este producto en las tiendas seleccionadas.' : 'Selecciona un producto.'}</div>)}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
