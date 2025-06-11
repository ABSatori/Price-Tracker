import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import { ChevronLeftIcon } from '../components/icons/SidebarIcons';
import { NavigationPath, BackendProduct } from '../types'; // BackendPriceHistory removed as PriceUpdater handles its own price state
import * as apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PriceUpdater from '../components/common/PriceUpdater'; // Import PriceUpdater

interface ProductScrapingDetailPageProps {
  comercio: string;
  productId: string;
  onNavigate: (path: NavigationPath, params?: Record<string, string>) => void;
}

const ProductScrapingDetailPage: React.FC<ProductScrapingDetailPageProps> = ({ 
  comercio, 
  productId, 
  onNavigate 
}) => {
  const [productDetails, setProductDetails] = useState<BackendProduct | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const products = await apiService.getProductos({ id_producto: productId });
        if (products.length > 0) {
          const product = products[0];
          if (product.nombre_tienda.toLowerCase() === comercio.toLowerCase()) { // Case-insensitive comparison
            setProductDetails(product);
          } else {
            console.warn(`Product ${productId} found, but belongs to ${product.nombre_tienda}, not ${comercio}.`);
            throw new Error(`El producto con ID ${productId} no pertenece al comercio ${comercio}.`);
          }
        } else {
          throw new Error(`Producto con ID ${productId} no encontrado.`);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar los detalles del producto.");
        console.error("Error fetching product details:",err);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId && comercio) {
      fetchData();
    } else {
      setError("Faltan parámetros: ID de producto o nombre de comercio.");
      setIsLoading(false);
    }
  }, [productId, comercio]);

  const handleGoBack = () => {
    // Navigate back to where the user came from, or a sensible default
    if (window.history.length > 2 && document.referrer.includes(window.location.host)) { // check if there's a previous page in our app
        window.history.back();
    } else {
        onNavigate(NavigationPath.HistoryList); // Default fallback
    }
  };

  const handleGenerateCSV = () => {
    if (!productDetails) {
        alert("No hay detalles de producto para generar CSV.");
        return;
    }
    
    // For CSV, we might want the latest price. PriceUpdater handles its own state.
    // This CSV generation will only use productDetails.
    // If PriceUpdater's current price is needed, it would need to be passed up or fetched again.
    // For simplicity, we'll indicate price is managed by PriceUpdater component.

    const csvData = [
      ['Campo', 'Valor'],
      ['ID Producto', productDetails.id_producto.toString()],
      ['Producto', productDetails.nombre],
      ['Comercio', productDetails.nombre_tienda],
      ['Marca', productDetails.nombre_marca],
      ['Categoría', productDetails.nombre_categoria],
      ['Sabor', productDetails.sabor || '-'],
      ['Volumen (ml)', productDetails.volumen_ml?.toString() || '-'],
      ['SKU', productDetails.sku || '-'],
      ['UPC', productDetails.upc || '-'],
      ['URL Producto', productDetails.url_producto || '-'],
      ['Precio', '(Consultar en el componente de Precio más abajo)'],
      ['Fecha Creación Registro', new Date(productDetails.creado_en).toLocaleDateString('es-MX')]
    ];

    const csvContent = csvData.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `detalle_producto_${comercio.replace(/[^a-zA-Z0-9]/g, '_')}_${productId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Archivo CSV con detalles del producto generado.');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
        <p className="ml-3 text-textMuted dark:text-slate-300">Cargando detalles del producto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <button
          onClick={handleGoBack}
          className="flex items-center text-sm text-primary dark:text-primary-light hover:underline mb-4"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Volver
        </button>
        <Card className="p-6 text-center bg-red-50 dark:bg-red-900 dark:bg-opacity-30 border border-red-200 dark:border-red-700">
          <p className="text-red-700 dark:text-red-300 font-semibold text-lg">Error al Cargar</p>
          <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            Reintentar Carga
          </button>
        </Card>
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="space-y-6 p-4">
        <button
          onClick={handleGoBack}
          className="flex items-center text-sm text-primary dark:text-primary-light hover:underline mb-4"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Volver
        </button>
        <Card className="p-6 text-center dark:bg-slate-700">
          <p className="text-textMuted dark:text-slate-400">No se encontraron detalles para este producto.</p>
        </Card>
      </div>
    );
  }
  
  const ReadOnlyField: React.FC<{ label: string; value: string | number | null | undefined, mono?: boolean }> = ({ label, value, mono=false }) => (
    <div>
        <label className="block text-xs font-semibold text-textMuted dark:text-slate-400 mb-0.5">{label}</label>
        <div className={`mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-800 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center break-words ${mono ? 'font-mono' : ''}`}>
            {value || value === 0 ? String(value) : <span className="text-gray-400 dark:text-slate-500">N/A</span>}
        </div>
    </div>
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center mb-3 sm:mb-0">
              <button
                onClick={handleGoBack}
                aria-label="Volver"
                className="mr-3 p-2 text-textMuted dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-textHeader dark:text-slate-100 truncate max-w-xs sm:max-w-md" title={`Detalle de Scraping: ${productDetails.nombre_tienda}`}>
                Detalle de Scraping: <span className="text-primary">{productDetails.nombre_tienda}</span>
              </h2>
            </div>
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={handleGenerateCSV}
                className="flex-1 sm:flex-none px-3 py-2 bg-green-custom hover:bg-opacity-90 text-white text-xs sm:text-sm font-medium rounded-md shadow-sm transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                CSV Detalle
              </button>
              {/* "Guardar Scraping" button can be removed if PriceUpdater handles all saving */}
            </div>
          </div>
        </div>
      </Card>

      {/* Product Details Card */}
      <Card>
        <div className="p-4 sm:p-6">
            <h3 className="text-base font-semibold text-textHeader dark:text-slate-200 mb-1">
                {productDetails.nombre}
            </h3>
            <p className="text-xs text-textMuted dark:text-slate-400 mb-4">
                ID Producto: <span className="font-mono">{productDetails.id_producto}</span> | Creado: {new Date(productDetails.creado_en).toLocaleDateString('es-MX')}
            </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <ReadOnlyField label="Marca" value={productDetails.nombre_marca} />
            <ReadOnlyField label="Categoría" value={productDetails.nombre_categoria} />
            <ReadOnlyField label="Sabor" value={productDetails.sabor} />
            <ReadOnlyField label="Volumen" value={productDetails.volumen_ml ? `${productDetails.volumen_ml} ml` : null} />
            <ReadOnlyField label="SKU" value={productDetails.sku} mono />
            <ReadOnlyField label="UPC" value={productDetails.upc} mono />
            <div className="md:col-span-2 lg:col-span-3">
                <ReadOnlyField label="URL del Producto" value={productDetails.url_producto} />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
                 <ReadOnlyField label="URL Base del Comercio" value={productDetails.url_producto ? new URL(productDetails.url_producto).origin : (productDetails.nombre_tienda ? `https://${productDetails.nombre_tienda.toLowerCase().replace(/[\s/]+/g, '')}.com` : null)} />
            </div>
          </div>
        </div>
      </Card>

      {/* PriceUpdater Component */}
      <PriceUpdater
        id_producto={productDetails.id_producto}
        nombreProducto={`${productDetails.nombre}`}
        autoUpdate={true} 
        showUpdateButton={true}
        className="w-full"
      />
    </div>
  );
};

export default ProductScrapingDetailPage;