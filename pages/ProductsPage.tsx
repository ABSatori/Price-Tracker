
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/common/Card';
import { ChevronLeftIcon } from '../components/icons/SidebarIcons';
import { BackendProduct, NavigationPath } from '../types';
import * as apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface ProductsPageProps {
  onNavigate: (path: NavigationPath, params?: Record<string, string>) => void;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getProductos(); 
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los productos");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredData = useMemo(() =>
    products.filter(product =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nombre_tienda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nombre_categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.nombre_marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.upc && product.upc.includes(searchTerm)) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.sabor && product.sabor.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [searchTerm, products]);

  const handleGoBack = () => {
    // Navigate back to HistoryList as per typical flow from this page
    onNavigate(NavigationPath.HistoryList);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex items-center">
            <button
              onClick={handleGoBack}
              aria-label="Volver al Historial"
              className="mr-3 p-1 text-textMuted dark:text-slate-400 hover:text-textHeader dark:hover:text-slate-200 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-textHeader dark:text-slate-100">Lista de Productos</h2>
              <p className="text-sm text-textMuted dark:text-slate-400 mt-1">
                {isLoading ? 'Cargando...' : `${filteredData.length} productos ${searchTerm ? 'encontrados' : 'disponibles'}`}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 sm:p-6">
          <div className="w-full max-w-md"> {/* Increased max-width for longer placeholder */}
            <label htmlFor="search" className="block text-sm font-medium text-textMuted dark:text-slate-300 mb-2">
              Buscar productos
            </label>
            <input
                type="text"
                id="search"
                placeholder="Filtrar por nombre, comercio, categoría, marca, UPC, SKU..."
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
              <button onClick={fetchProducts} className="mt-2 px-3 py-1 bg-primary text-white rounded-md text-sm">Reintentar</button>
            </div>
          )}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-slate-600">
                  <tr className="border-b border-contentBorder dark:border-slate-600">
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Comercio</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Categoría</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Marca</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Producto</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Sabor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Volumen</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">UPC</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-primary">Fecha Creación</th>
                  </tr>
                </thead>
                <tbody className="bg-card dark:bg-slate-700 divide-y divide-contentBorder dark:divide-slate-600">
                  {filteredData.length > 0 ? (
                    filteredData.map((product) => (
                      <tr key={product.id_producto} className="hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100 font-mono">
                          {product.id_producto}
                        </td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">
                          {product.nombre_tienda}
                        </td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">
                          {product.nombre_categoria}
                        </td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">
                          {product.nombre_marca}
                        </td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100 max-w-xs">
                          <div className="truncate" title={product.nombre}>
                            {product.nombre}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">{product.sabor || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-textHeader dark:text-slate-100">{product.volumen_ml ? `${product.volumen_ml}ml` : 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-textMuted dark:text-slate-300 font-mono">{product.upc || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-textMuted dark:text-slate-300 font-mono">{product.sku || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-textMuted dark:text-slate-400">{new Date(product.creado_en).toLocaleDateString('es-MX')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-textMuted dark:text-slate-400">
                        No se encontraron productos que coincidan con tu búsqueda.
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

export default ProductsPage;