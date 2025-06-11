
import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import { ChevronLeftIcon } from '../components/icons/SidebarIcons';
import { NavigationPath, BackendProduct, BackendPriceHistory } from '../types';
import * as apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface ProductDataFromScraping {
    comercio: string;
    productId: string; // This is the id_producto from our database
    producto: string; // Name of the product
    marca: string;
    categoria: string;
    variante: string; // e.g., 946ml
    sabor: string;
    sku: string;
    upc: string;
    urlComercio: string;
    urlProducto: string;
    precio: number; // The price scraped or identified
}

interface ScrapingReviewPageProps {
  onNavigateBack: () => void;
  productData?: ProductDataFromScraping; // Received from App.tsx (sessionStorage)
}

const ScrapingReviewPage: React.FC<ScrapingReviewPageProps> = ({ 
  onNavigateBack, 
  productData 
}) => {
  // Estados para los detalles a mostrar. Pueden ser de productData o de la API.
  const [displayComercio, setDisplayComercio] = useState<string>('');
  const [displayProducto, setDisplayProducto] = useState<string>('');
  const [displayMarca, setDisplayMarca] = useState<string>('');
  const [displayCategoria, setDisplayCategoria] = useState<string>('');
  const [displayVariante, setDisplayVariante] = useState<string>('');
  const [displaySabor, setDisplaySabor] = useState<string>('');
  const [displaySku, setDisplaySku] = useState<string>('');
  const [displayUpc, setDisplayUpc] = useState<string>('');
  const [displayUrlComercio, setDisplayUrlComercio] = useState<string>('');
  const [displayUrlProducto, setDisplayUrlProducto] = useState<string>('');
  const [displayPrecio, setDisplayPrecio] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false); // Only true if fetching additional data
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productData) {
      console.log("[ScrapingReviewPage] Product data received:", productData);
      // Populate display states directly from productData
      setDisplayComercio(productData.comercio);
      setDisplayProducto(productData.producto);
      setDisplayMarca(productData.marca);
      setDisplayCategoria(productData.categoria);
      setDisplayVariante(productData.variante);
      setDisplaySabor(productData.sabor);
      setDisplaySku(productData.sku);
      setDisplayUpc(productData.upc);
      setDisplayUrlComercio(productData.urlComercio);
      setDisplayUrlProducto(productData.urlProducto);
      setDisplayPrecio(productData.precio);

      // Clear sessionStorage after use (optional, but good practice)
      // sessionStorage.removeItem('scrapingReviewProductData');
    } else {
      // This case should ideally not happen if navigation is always from ScrapingPage with data
      // If it can happen, you might want to fetch some default data or show an error
      setError("No se proporcionaron datos del producto para la revisión.");
      console.warn("[ScrapingReviewPage] No productData received via props.");
    }
  }, [productData]);

  const handleGenerateCSV = () => {
    if (!productData) {
        alert("No hay datos de producto para generar CSV.");
        return;
    }
    
    const csvData = [
      ['Campo', 'Valor'],
      ['Producto', displayProducto],
      ['Comercio', displayComercio],
      ['Marca', displayMarca],
      ['Categoría', displayCategoria],
      ['Variante/Tamaño', displayVariante],
      ['Sabor', displaySabor || '-'],
      ['SKU', displaySku || '-'],
      ['UPC', displayUpc || '-'],
      ['URL Comercio', displayUrlComercio || '-'],
      ['URL Producto', displayUrlProducto || '-'],
      ['Precio Scrapeado', displayPrecio !== null ? `MXN ${displayPrecio.toFixed(2)}` : 'N/A'],
    ];

    const csvContent = csvData.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `review_scraping_${displayComercio.replace(/[^a-zA-Z0-9]/g, '_')}_${displayProducto.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Archivo CSV generado.');
  };

  const handleSaveScraping = () => {
    // Here you would typically call an API service to save the data
    // For now, it's just an alert.
    if (!productData) {
        alert("No hay datos de producto para guardar.");
        return;
    }
    alert('Funcionalidad "Guardar Scraping" (simulado). Los datos se enviarían al backend.');
    console.log("Datos para guardar:", productData);
    // Example: apiService.saveReviewedScrapingData(productData);
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
          onClick={onNavigateBack}
          className="flex items-center text-sm text-primary dark:text-primary-light hover:underline mb-4"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Volver
        </button>
        <Card className="p-6 text-center dark:bg-slate-700">
          <p className="text-textMuted dark:text-slate-400">Error: {error}</p>
        </Card>
      </div>
    );
  }
  
  if (!productData && !error) { // Handle case where no product data is passed and not already in error state
    return (
      <div className="space-y-6">
        <button
          onClick={onNavigateBack}
          className="flex items-center text-sm text-primary dark:text-primary-light hover:underline mb-4"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Volver
        </button>
        <Card className="p-6 text-center dark:bg-slate-700">
          <p className="text-textMuted dark:text-slate-400">No se proporcionaron datos del producto para la revisión. Por favor, intente el scrapeo nuevamente.</p>
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
                onClick={onNavigateBack}
                aria-label="Volver"
                className="mr-3 p-1 text-textMuted dark:text-slate-400 hover:text-textHeader dark:hover:text-slate-200 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-textHeader dark:text-slate-100">
                Web Scraping {displayComercio || "Comercio no especificado"}
              </h2>
            </div>
            <div className="flex space-x-3 mt-3 sm:mt-0">
              <button
                onClick={handleGenerateCSV}
                disabled={!productData}
                className="px-4 py-2 bg-green-custom hover:bg-opacity-90 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
              >
                Generar csv
              </button>
              <button
                onClick={handleSaveScraping}
                 disabled={!productData}
                className="px-4 py-2 bg-blue-custom hover:bg-opacity-90 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
              >
                Guardar Scraping
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Product Details */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Producto */}
            <div>
              <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                Producto
              </label>
              <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center text-base font-medium">
                {displayProducto || '-'}
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                  URL del comercio
                </label>
                <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-300 min-h-[42px] flex items-center break-all">
                  {displayUrlComercio || '-'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                  URL del Producto
                </label>
                <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-300 min-h-[42px] flex items-center break-all">
                  {displayUrlProducto || '-'}
                </div>
              </div>
            </div>

            {/* Marca y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                  Marca del producto
                </label>
                <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center">
                  {displayMarca || '-'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                  Categoría
                </label>
                <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center">
                  {displayCategoria || '-'}
                </div>
              </div>
            </div>

            {/* Unidad de medida y Tamaño(Variante) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                  Unidad de medida producto en {displayComercio || "Comercio"}
                </label>
                <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center">
                  {displayVariante && parseFloat(displayVariante) >= 1000 ? 'Litros' : (displayVariante ? 'Mililitros' : '-')}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                  Tamaño / Variante
                </label>
                <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center">
                  {displayVariante || '-'}
                </div>
              </div>
            </div>

            {/* SKU y UPC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                  SKU del producto
                </label>
                <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center font-mono">
                  {displaySku || '-'}
                </div>
              </div>
               <div>
                <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                  UPC de producto
                </label>
                <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center font-mono">
                  {displayUpc || '-'}
                </div>
              </div>
            </div>

            {/* Sabor */}
            <div>
              <label className="block text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">
                Sabor del producto
              </label>
              <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 dark:bg-slate-600 rounded-md text-sm text-gray-700 dark:text-slate-200 min-h-[42px] flex items-center">
                {displaySabor || '-'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Price Section */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="border border-contentBorder dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700">
            <div className="mb-2">
              <label className="block text-xs font-semibold text-textMuted dark:text-slate-300">
                Precio en {displayComercio || "Comercio"}
              </label>
            </div>
            <div className="bg-card dark:bg-slate-600 rounded-md p-4 border border-contentBorder dark:border-slate-500">
              <div className="text-lg font-semibold text-textHeader dark:text-slate-100">
                <span className="text-sm text-textMuted dark:text-slate-400">Resultado del precio en {displayComercio || "Comercio"}: </span>
                <span className="text-2xl font-bold">
                  {displayPrecio !== null ? `MXN ${displayPrecio.toFixed(2)}` : 'MXN --.--'}
                </span>
              </div>
              {/* No "Capturado el" date here as this data is from a fresh scrape/IA attempt */}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ScrapingReviewPage;