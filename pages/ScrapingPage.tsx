
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/common/Card';
import { useDataSender } from '../hooks/useDataSender';
import { ScrapingDataPayload, NavigationPath, RetailerInfo, BackendProduct } from '../types';
import { SparklesIcon, ChevronDownIcon } from '../components/icons/SidebarIcons'; 
import LoadingSpinner from '../components/common/LoadingSpinner'; 
import * as apiService from '../services/apiService';
import { SCRAPER_URL } from '../constants';

// Define ReadOnlyDetail component
const ReadOnlyDetail: React.FC<{label: string, value: string | null | undefined, isLoading?: boolean }> = ({label, value, isLoading = false}) => (
   <div>
      <label className="block text-xs font-medium text-textMuted dark:text-slate-300 mb-0.5">{label}</label>
      <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center">
      {isLoading ? <LoadingSpinner size="sm" color="text-gray-500" /> : (value || '-')}
      </div>
  </div>
);

interface ScrapingPageProps {
  onNavigateToScrapingIA: () => void;
  onNavigate: (path: NavigationPath, params?: Record<string, string>) => void; 
}

const ScrapingPage: React.FC<ScrapingPageProps> = ({ onNavigateToScrapingIA, onNavigate }) => {
  // Estados para datos de la API
  const [allRetailers, setAllRetailers] = useState<RetailerInfo[]>([]);
  const [allProducts, setAllProducts] = useState<BackendProduct[]>([]);
  
  // Estados de carga y error para datos iniciales
  const [isLoadingInitialData, setIsLoadingInitialData] = useState<boolean>(true);
  const [initialDataError, setInitialDataError] = useState<string | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(false);

  // Estados del formulario y selecciones
  const [comercioInput, setComercioInput] = useState<string>(''); // Selected Retailer Name
  const [productoInput, setProductoInput] = useState<string>(''); // Selected Product ID
  
  // Estados para campos autocompletados (mostrados como ReadOnlyDetail)
  const [urlComercioInput, setUrlComercioInput] = useState<string>('');
  const [urlProductoInput, setUrlProductoInput] = useState<string>('');
  const [marcaProductoInput, setMarcaProductoInput] = useState<string>('');
  const [categoriaInput, setCategoriaInput] = useState<string>('');
  const [varianteDisplay, setVarianteDisplay] = useState<string>(''); // For displaying derived variant
  const [saborProductoInput, setSaborProductoInput] = useState<string>('');
  const [skuDelProductoInput, setSkuDelProductoInput] = useState<string>('');
  const [upcDeProductoInput, setUpcDeProductoInput] = useState<string>('');
  const [precioActual, setPrecioActual] = useState<string>('MXN --.--');

  const [isFormPrimarilyValid, setIsFormPrimarilyValid] = useState<boolean>(false);

  const { estado: dataSenderStatus, feedback: dataSenderFeedback, enviar: sendScrapingDataToBackend, reset: resetDataSender } = useDataSender();

  // State for scraping integration
  const [isSendingToScraper, setIsSendingToScraper] = useState<boolean>(false);
  const [scrapingMessage, setScrapingMessage] = useState<string | null>(null);
  const [scrapingMessageType, setScrapingMessageType] = useState<'success' | 'error' | 'info' | null>(null);


  // Cargar datos iniciales (comercios y todos los productos)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingInitialData(true);
      setInitialDataError(null);
      try {
        console.log('[ScrapingPage] Cargando datos iniciales...');
        const [retailersData, productsData] = await Promise.all([
          apiService.getTiendas(),
          apiService.getProductos() // Fetches all products initially
        ]);

        console.log('[ScrapingPage] Datos iniciales cargados:', {
          retailers: retailersData.length,
          products: productsData.length
        });

        setAllRetailers(retailersData);
        setAllProducts(productsData);

        if (retailersData.length > 0) {
          setComercioInput(retailersData[0].name); // Default to first retailer
        }
      } catch (error: any) {
        console.error('[ScrapingPage] Error cargando datos iniciales:', error);
        setInitialDataError(error.message || 'Error al cargar datos para el formulario');
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    fetchInitialData();
  }, []);

  // Opciones para el selector de comercios
  const comercioOptions = useMemo(() => {
    if (allRetailers.length === 0) return [{ value: "", label: "Cargando comercios...", url: "" }];
    return [{ value: "", label: "Seleccione un comercio", url: "" }, ...allRetailers.map(r => ({ value: r.name, label: r.name, url: r.url }))];
  }, [allRetailers]);

  // Opciones para el selector de productos, filtrados por comercio
  const productoOptions = useMemo(() => {
    if (!comercioInput || allProducts.length === 0) return [{ value: "", label: "Seleccione un comercio primero" }];
    
    const filtered = allProducts.filter(p => p.nombre_tienda === comercioInput);
    if (filtered.length === 0) return [{ value: "", label: "No hay productos para este comercio" }];
    
    return [
      { value: "", label: `Seleccione un producto (${filtered.length})` },
      ...filtered.map(p => ({
        value: String(p.id_producto),
        label: `${p.nombre} ${p.volumen_ml ? `(${p.volumen_ml}ml)` : ''} ${p.sabor ? `- ${p.sabor}` : ''}`.trim()
      }))
    ];
  }, [comercioInput, allProducts]);


  // Validar formulario principal
  useEffect(() => {
    setIsFormPrimarilyValid(
      comercioInput.trim() !== '' &&
      productoInput.trim() !== '' // productoInput es ahora el ID
    );
  }, [comercioInput, productoInput]);

  // Autocompletar detalles y obtener precio cuando cambia el producto seleccionado
  useEffect(() => {
    const selectedRetailer = allRetailers.find(r => r.name === comercioInput);
    setUrlComercioInput(selectedRetailer?.url || '');

    if (!productoInput) { // Si no hay ID de producto, limpiar detalles
      setUrlProductoInput(''); setMarcaProductoInput(''); setCategoriaInput('');
      setVarianteDisplay(''); setSaborProductoInput('');
      setSkuDelProductoInput(''); setUpcDeProductoInput('');
      setPrecioActual('MXN --.--');
      return;
    }

    const selectedProductObject = allProducts.find(p => String(p.id_producto) === productoInput);

    if (selectedProductObject) {
      setUrlProductoInput(selectedProductObject.url_producto || '');
      setMarcaProductoInput(selectedProductObject.nombre_marca || '');
      setCategoriaInput(selectedProductObject.nombre_categoria || '');
      setSaborProductoInput(selectedProductObject.sabor || '');
      setSkuDelProductoInput(selectedProductObject.sku || '');
      setUpcDeProductoInput(selectedProductObject.upc || '');
      setVarianteDisplay(selectedProductObject.volumen_ml ? `${selectedProductObject.volumen_ml}ml` : 'N/A');

      // Obtener el precio más reciente
      const fetchPrice = async () => {
        setIsLoadingPrice(true);
        setPrecioActual('Cargando precio...');
        try {
          const priceHistory = await apiService.getHistorialPrecios({ id_producto: productoInput, limit: 1 });
          if (priceHistory.length > 0) {
            setPrecioActual(`MXN ${priceHistory[0].precio.toFixed(2)}`);
          } else {
            setPrecioActual('MXN --.--');
          }
        } catch (error) {
          console.error("Error fetching price for product ID " + productoInput, error);
          setPrecioActual('Error al cargar precio');
        } finally {
          setIsLoadingPrice(false);
        }
      };
      fetchPrice();
    } else {
        setUrlProductoInput(''); setMarcaProductoInput(''); setCategoriaInput('');
        setVarianteDisplay(''); setSaborProductoInput('');
        setSkuDelProductoInput(''); setUpcDeProductoInput('');
        setPrecioActual('MXN --.--');
    }
  }, [comercioInput, productoInput, allRetailers, allProducts]);
  
  useEffect(() => {
    setProductoInput(''); 
  }, [comercioInput]);


  const handleIniciarScraping = async () => {
    if (!isFormPrimarilyValid) {
      setScrapingMessage('Por favor, seleccione un comercio y un producto.');
      setScrapingMessageType('error');
      return;
    }
    if (!urlProductoInput) {
      setScrapingMessage('La URL del producto es necesaria para iniciar el scraping. Este producto no tiene una URL registrada.');
      setScrapingMessageType('error');
      return;
    }

    // Obtener precio ANTES de empezar el proceso
    let precioNumero: number | undefined = undefined;
    const matchPrecio = precioActual.match(/MXN\s*([\d.]+)/);
    if (matchPrecio && matchPrecio[1]) {
      precioNumero = parseFloat(matchPrecio[1]);
    }

    setIsSendingToScraper(true);
    setScrapingMessage('Enviando tarea de scraping...');
    setScrapingMessageType('info');
    
    // AHORA SÍ quitar precio actual y mostrar loading
    setPrecioActual('');
    setIsLoadingPrice(true);

    const selectedProductObject = allProducts.find(p => String(p.id_producto) === productoInput);
    if (!selectedProductObject) {
      setScrapingMessage('Error: Producto seleccionado no encontrado.');
      setScrapingMessageType('error');
      setIsSendingToScraper(false);
      setIsLoadingPrice(false);
      return;
    }

    const payload: ScrapingDataPayload = {
      comercio: selectedProductObject.nombre_tienda,
      producto: selectedProductObject.nombre,
      variante: selectedProductObject.volumen_ml ? `${selectedProductObject.volumen_ml}ml` : '',
      urlComercio: urlComercioInput || undefined,
      urlProducto: urlProductoInput,
      marca: selectedProductObject.nombre_marca || undefined,
      categoria: selectedProductObject.nombre_categoria || undefined,
      sku: selectedProductObject.sku || undefined,
      upc: selectedProductObject.upc || undefined,
      sabor: selectedProductObject.sabor || undefined,
      unidadMedida: selectedProductObject.volumen_ml ? 'ml' : undefined,
      precio: precioNumero,
      moneda: 'MXN'
    };

    try {
      const response = await fetch(SCRAPER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        setScrapingMessage(`Tarea de scraping para "${payload.producto}" enviada exitosamente. Esperando que termine el scraping...`);
        setScrapingMessageType('success');
        
        setTimeout(async () => {
          try {
            setScrapingMessage('Verificando si hay precio nuevo en la base de datos...');
            const priceHistory = await apiService.getHistorialPrecios({ 
              id_producto: productoInput, 
              limit: 1 
            });
            if (priceHistory.length > 0) {
              setPrecioActual(`MXN ${priceHistory[0].precio.toFixed(2)}`);
              setScrapingMessage(`Precio actualizado exitosamente: MXN ${priceHistory[0].precio.toFixed(2)}`);
            } else {
              setPrecioActual('MXN --.--');
              setScrapingMessage('No se encontró precio nuevo en la base de datos.');
            }
          } catch (error) {
            console.error("Error loading updated price:", error);
            setScrapingMessage('Error al verificar precio actualizado.');
            setPrecioActual('Error al cargar precio');
          } finally {
            setIsLoadingPrice(false);
          }
        }, 80000); // Esperar 1.20 minuto 
      } else {
        throw new Error(responseData.message || responseData.error || 'Error al obtener el precio actualizado.');
      }
    } catch (error: any) {
      console.error("Error during scraping:", error);
      setScrapingMessage(`Error al enviar tarea de scraping: ${error.message}`);
      setScrapingMessageType('error');
      setIsLoadingPrice(false);
      // Restaurar precio anterior
      const fetchPrice = async () => {
        try {
          if (productoInput) {
            const priceHistory = await apiService.getHistorialPrecios({ id_producto: productoInput, limit: 1 });
            if (priceHistory.length > 0) {
              setPrecioActual(`MXN ${priceHistory[0].precio.toFixed(2)}`);
            } else {
              setPrecioActual('MXN --.--');
            }
          } else {
            setPrecioActual('MXN --.--');
          }
        } catch (restoreError) {
          console.error("Error restoring price after scraping failure:", restoreError);
          setPrecioActual('Error al cargar precio');
        }
      };
      fetchPrice();
    } finally {
      setIsSendingToScraper(false);
    }
  };
  
  const handleRegistrarScrapeoManual = async () => {
    if (!isFormPrimarilyValid) {
        resetDataSender(); 
        alert('Por favor, seleccione un comercio y un producto antes de registrar.');
        return;
    }

    let precioNumero: number | undefined = undefined;
    const matchPrecio = precioActual.match(/MXN\s*([\d.]+)/);
    if (matchPrecio && matchPrecio[1]) {
      precioNumero = parseFloat(matchPrecio[1]);
    }

    if (typeof precioNumero === 'undefined' || isNaN(precioNumero)) {
        alert('No se pudo determinar el precio actual del producto. No se puede registrar sin precio.');
        return;
    }
    
    const selectedProductObject = allProducts.find(p => String(p.id_producto) === productoInput);
    if (!selectedProductObject) {
        alert('Producto seleccionado no encontrado. No se pueden enviar los datos.');
        return;
    }
    
    const payload: ScrapingDataPayload = {
      comercio: comercioInput,
      producto: selectedProductObject.nombre, 
      variante: selectedProductObject.volumen_ml ? `${selectedProductObject.volumen_ml}ml` : '', 
      urlComercio: urlComercioInput || undefined,
      urlProducto: urlProductoInput || undefined,
      marca: selectedProductObject.nombre_marca || undefined,
      categoria: selectedProductObject.nombre_categoria || undefined,
      sku: selectedProductObject.sku || undefined,
      upc: selectedProductObject.upc || undefined,
      sabor: selectedProductObject.sabor || undefined,
      unidadMedida: selectedProductObject.volumen_ml ? 'ml' : undefined, 
      precio: precioNumero, 
      moneda: 'MXN' 
    };
    
    await sendScrapingDataToBackend(payload); 
  };
  
  const getFeedbackClasses = (type: 'dataSender' | 'scraping') => {
    let message: string | null = null;
    let status: string | null = null;

    if (type === 'dataSender') {
        message = dataSenderFeedback;
        status = dataSenderStatus;
    } else {
        message = scrapingMessage;
        status = scrapingMessageType;
    }

    if (message) {
        if (status === 'enviando' || status === 'obteniendo_ids' || status === 'creando_producto' || status === 'creando_historial' || status === 'info') {
             return 'text-blue-700 bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300 dark:border-blue-700';
        }
        switch (status) {
          case 'ok': 
          case 'success':
            return 'text-green-700 bg-green-100 border border-green-300 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300 dark:border-green-700';
          case 'err':
          case 'error':
            return 'text-red-700 bg-red-100 border border-red-300 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-300 dark:border-red-700';
          case 'skipped': return 'text-gray-700 bg-gray-100 border border-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500';
          default: 
            return 'text-gray-700 bg-gray-100 border border-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500'; 
        }
    }
    return ''; 
  };

  const handleNavigateToReview = () => {
    if (!isFormPrimarilyValid || !productoInput) {
      alert('Por favor, seleccione un comercio y un producto antes de revisar.');
      return;
    }

    const selectedProductObject = allProducts.find(p => String(p.id_producto) === productoInput);
    if (!selectedProductObject) {
      alert('Producto seleccionado no encontrado.');
      return;
    }

    let precioNumero = 0;
    const matchPrecio = precioActual.match(/MXN\s*([\d.]+)/);
    if (matchPrecio && matchPrecio[1]) {
      precioNumero = parseFloat(matchPrecio[1]);
    }

    const productDataForReview = {
      comercio: comercioInput,
      productId: productoInput,
      producto: selectedProductObject.nombre,
      marca: selectedProductObject.nombre_marca || '',
      categoria: selectedProductObject.nombre_categoria || '',
      variante: selectedProductObject.volumen_ml ? `${selectedProductObject.volumen_ml}ml` : '',
      sabor: selectedProductObject.sabor || '',
      sku: selectedProductObject.sku || '',
      upc: selectedProductObject.upc || '',
      urlComercio: urlComercioInput,
      urlProducto: urlProductoInput,
      precio: precioNumero
    };
    
    sessionStorage.setItem('scrapingReviewProductData', JSON.stringify(productDataForReview));
    onNavigate(NavigationPath.ScrapingReview);
  };
  
  const isProcessingForBackend = dataSenderStatus === 'enviando' || dataSenderStatus === 'obteniendo_ids' || dataSenderStatus === 'creando_producto' || dataSenderStatus === 'creando_historial';
  const isPrecioValidForManualRegistration = precioActual !== 'MXN --.--' && !precioActual.includes('Error') && !isLoadingPrice;

  if (isLoadingInitialData) {
    return (
      <div className="space-y-6">
        <Card><div className="p-4 sm:p-6"><h2 className="text-xl font-semibold text-textHeader dark:text-slate-100 mb-3">Scraping Manual</h2></div></Card>
        <Card><div className="p-4 sm:p-6 flex justify-center items-center py-20"><LoadingSpinner size="lg" /><span className="ml-3 text-textMuted dark:text-slate-300">Cargando datos del formulario...</span></div></Card>
      </div>
    );
  }

  if (initialDataError) {
    return (
      <div className="space-y-6">
        <Card><div className="p-4 sm:p-6"><h2 className="text-xl font-semibold text-textHeader dark:text-slate-100 mb-3">Scraping Manual</h2></div></Card>
        <Card><div className="p-4 sm:p-6 text-center py-10 text-red-500 dark:text-red-400"><p>Error: {initialDataError}</p><button onClick={() => window.location.reload()} className="mt-2 px-3 py-1 bg-primary text-white rounded-md text-sm">Reintentar</button></div></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card> 
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-xl font-semibold text-textHeader dark:text-slate-100 mb-3 sm:mb-0">
              Scraping Manual - Datos Reales
            </h2>
            <button
              onClick={onNavigateToScrapingIA}
              className="flex items-center px-4 py-2 bg-accent text-white hover:bg-opacity-90 text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent dark:focus:ring-offset-slate-800"
            >
              <SparklesIcon className="w-4 h-4 mr-2"/>
              Scraping IA (Búsqueda Libre)
            </button>
          </div>
           <p className="text-sm text-textMuted dark:text-slate-400 mt-2">
            {allRetailers.length} comercios • {allProducts.length} productos base cargados
          </p>
        </div>
      </Card>

      <Card>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <div className="relative">
                <label htmlFor="comercioInput" className="block text-xs font-medium text-textMuted dark:text-slate-300 mb-0.5">Selecciona el comercio *</label>
                <select
                  id="comercioInput"
                  value={comercioInput}
                  onChange={(e) => setComercioInput(e.target.value)}
                  disabled={isLoadingInitialData || isProcessingForBackend || isSendingToScraper || comercioOptions.length <=1 }
                  className="appearance-none mt-1 block w-full p-2.5 border border-input-border dark:border-slate-500 bg-card dark:bg-slate-600 rounded-md text-sm text-textHeader dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-input-focus-ring dark:focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-slate-500"
                >
                  {comercioOptions.map(option => (
                    <option key={option.value || 'default-comercio'} value={option.value} disabled={option.value === ""}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-textMuted dark:text-slate-400 absolute right-3 top-1/2 mt-0.5 pointer-events-none"/>
            </div>

            <div className="relative">
                <label htmlFor="productoInput" className="block text-xs font-medium text-textMuted dark:text-slate-300 mb-0.5">Selecciona el producto *</label>
                <select
                  id="productoInput"
                  value={productoInput}
                  onChange={(e) => setProductoInput(e.target.value)}
                  disabled={isLoadingInitialData || isProcessingForBackend || isSendingToScraper || productoOptions.length <= 1 || !comercioInput}
                  className="appearance-none mt-1 block w-full p-2.5 border border-input-border dark:border-slate-500 bg-card dark:bg-slate-600 rounded-md text-sm text-textHeader dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-input-focus-ring dark:focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-slate-500"
                >
                  {productoOptions.map(option => (
                    <option key={option.value || 'default-producto'} value={option.value} disabled={option.value === ""}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-textMuted dark:text-slate-400 absolute right-3 top-1/2 mt-0.5 pointer-events-none"/>
            </div>
          </div>

          <div className="space-y-4 mb-6 pt-6 border-t border-contentBorder dark:border-slate-600">
            <h3 className="text-base font-medium text-textHeader dark:text-slate-100">Detalles Adicionales del Producto (Automático)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <ReadOnlyDetail label="URL del comercio" value={urlComercioInput} isLoading={isLoadingInitialData} />
              <ReadOnlyDetail label="URL del Producto" value={urlProductoInput} isLoading={isLoadingInitialData} />
              <ReadOnlyDetail label="Marca del producto" value={marcaProductoInput} isLoading={isLoadingInitialData} />
              <ReadOnlyDetail label="Categoría" value={categoriaInput} isLoading={isLoadingInitialData} />
              <ReadOnlyDetail label="Variante (derivada)" value={varianteDisplay} isLoading={isLoadingInitialData} />
              <ReadOnlyDetail label="Sabor del producto" value={saborProductoInput} isLoading={isLoadingInitialData} />
              <ReadOnlyDetail label="SKU del producto" value={skuDelProductoInput} isLoading={isLoadingInitialData} />
              <ReadOnlyDetail label="UPC de producto" value={upcDeProductoInput} isLoading={isLoadingInitialData} />
            </div>
          </div>

          <div className="space-y-4 mb-6 pt-6 border-t border-contentBorder dark:border-slate-600">
            <h3 className="text-base font-medium text-textHeader dark:text-slate-100">Acciones de Scraping</h3>
            <div className="border border-contentBorder dark:border-slate-600 rounded-md p-4 bg-gray-50 dark:bg-slate-600">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="flex-1 mb-3 sm:mb-0">
                  <p className="text-sm text-textMuted dark:text-slate-300 mb-1">Último precio registrado para este producto:</p>
                  <div className="bg-card dark:bg-slate-500 p-3 rounded-md border border-contentBorder dark:border-slate-500 min-h-[50px] flex items-center justify-center">
                    {isLoadingPrice ? 
                        <div className="flex items-center justify-center w-full">
                            <LoadingSpinner size="lg" color="text-textHeader dark:text-slate-100" />
                            <span className="ml-3 text-textMuted dark:text-slate-300 text-sm">Consultando nuevo precio...</span>
                        </div>
                        :
                        <span className="text-xl font-semibold text-textHeader dark:text-slate-100">
                          {precioActual || 'MXN --.--'}
                        </span>
                    }
                  </div>
                </div>
                <div className="ml-0 sm:ml-4 flex flex-col space-y-3 w-full sm:w-auto">
                  <button
                    onClick={handleIniciarScraping}
                    disabled={isLoadingInitialData || !isFormPrimarilyValid || !urlProductoInput || isSendingToScraper || isProcessingForBackend}
                    className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-md transition-colors disabled:bg-gray-300 dark:disabled:bg-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSendingToScraper ? (<LoadingSpinner size="sm" color="text-white" className="mr-2 inline-block"/>) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    )}
                    {isSendingToScraper ? 'Enviando Tarea...' : 'Iniciar Scraping'}
                  </button>
                  <button
                    onClick={handleRegistrarScrapeoManual}
                    disabled={isLoadingInitialData || !isFormPrimarilyValid || isProcessingForBackend || !isPrecioValidForManualRegistration || isSendingToScraper} 
                    className="w-full px-6 py-3 bg-green-custom hover:bg-opacity-90 text-white text-sm font-medium rounded-md transition-colors disabled:bg-gray-300 dark:disabled:bg-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessingForBackend ? (<LoadingSpinner size="sm" color="text-white" className="mr-2 inline-block"/>) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    )}
                    {isProcessingForBackend ? 'Registrando...' : 'Registrar Precio Actual'}
                  </button>
                </div>
              </div>
               <p className="text-xs text-textMuted dark:text-slate-400 mt-3">
                <strong>Iniciar Scraping:</strong> Envía una tarea para obtener el precio más reciente de <code className="bg-gray-200 dark:bg-slate-500 px-1 rounded">{urlProductoInput || 'URL del producto'}</code>.<br/>
                <strong>Registrar Precio Actual:</strong> Guarda el precio de <code className="bg-gray-200 dark:bg-slate-500 px-1 rounded">{precioActual}</code> en la base de datos.
              </p>
            </div>
             <button
                onClick={handleNavigateToReview}
                disabled={isLoadingInitialData || !isFormPrimarilyValid || isProcessingForBackend || isSendingToScraper} 
                className="mt-4 w-full sm:w-auto px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-md transition-colors disabled:bg-gray-300 dark:disabled:bg-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                 Revisar y Registrar Manualmente
              </button>
          </div>
          
          {scrapingMessage && (
            <div className="mt-4">
              <p 
                className={`text-sm p-3 rounded-md ${getFeedbackClasses('scraping')}`}
                role="alert"
                aria-live="assertive"
              >
                {scrapingMessage}
              </p>
            </div>
          )}
          {dataSenderFeedback && (
            <div className={`mt-4 ${scrapingMessage ? 'pt-4 border-t border-contentBorder dark:border-slate-600' : ''}`}>
              <p 
                className={`text-sm p-3 rounded-md ${getFeedbackClasses('dataSender')}`}
                role="alert"
                aria-live="assertive"
              >
                {dataSenderFeedback}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ScrapingPage;
