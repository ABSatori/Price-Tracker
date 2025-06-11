
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/common/Card';
import { SearchIcon, PencilIcon, TrashIcon, PlusCircleIcon } from '../components/icons/FeatureIcons';
import { RetailerInfo } from '../types';
import * as apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

// const mockRetailers: RetailerInfo[] = [
//   { id: '1', name: 'Walmart Super/Express', url: 'https://www.walmart.com.mx/', logoUrl: 'https://ui-avatars.com/api/?name=W&background=0D8ABC&color=fff&size=40&rounded=true' },
//   { id: '2', name: 'Bodega Aurrera', url: 'https://www.bodegaaurrera.com.mx/', logoUrl: 'https://ui-avatars.com/api/?name=B&background=F06292&color=fff&size=40&rounded=true' },
//   { id: '3', name: 'Soriana', url: 'https://www.soriana.com/', logoUrl: 'https://ui-avatars.com/api/?name=S&background=78909C&color=fff&size=40&rounded=true' },
// ];

const RetailersPage: React.FC = () => {
  const [retailers, setRetailers] = useState<RetailerInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRetailers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getTiendas();
      setRetailers(data.map(r => ({...r, logoUrl: `https://ui-avatars.com/api/?name=${r.name.charAt(0)}&background=0D8ABC&color=fff&size=40&rounded=true`}))); // Add default logo
    } catch (err: any) {
      setError(err.message || "Error al cargar comercios");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRetailers();
  }, []);

  const filteredRetailers = useMemo(() => {
    if (!searchTerm) return retailers;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return retailers.filter(retailer =>
      retailer.name.toLowerCase().includes(lowerSearchTerm) ||
      retailer.url.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, retailers]);

  const handleAddRetailer = async () => {
    // For now, simple prompt. A modal form would be better.
    const name = prompt("Nombre del nuevo comercio:");
    if (!name) return;
    const url = prompt(`URL base para ${name}:`);
    if (!url) return;
    const codigo_pais = prompt(`Código de país para ${name} (ej. MX):`, "MX");

    try {
      await apiService.addTienda({ name, url, codigo_pais: codigo_pais || undefined });
      alert("Comercio agregado con éxito. Actualizando lista...");
      fetchRetailers(); // Re-fetch the list
    } catch (err: any) {
      alert(`Error al agregar comercio: ${err.message}`);
      console.error(err);
    }
  };

  // Edit and delete are non-functional due to backend limitations
  // const handleEditRetailer = (retailer: RetailerInfo) => {
  //    alert(`Editar ${retailer.name} (Próximamente). PUT /tiendas/:id no está en el backend actual.`);
  // };
  
  // const handleDeleteRetailer = (retailerId: string) => {
  //    alert(`Eliminar comercio ID ${retailerId} (Próximamente). DELETE /tiendas/:id no está en el backend actual.`);
  // };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-textHeader dark:text-slate-100">Comercios</h2>
        <button
          onClick={handleAddRetailer}
          className="flex items-center px-4 py-2 bg-primary hover:bg-opacity-90 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-offset-slate-800"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Agregar comercio
        </button>
      </div>

      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex justify-end mb-6">
            <div className="relative w-full sm:w-auto sm:max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Buscar comercio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-input-bg dark:bg-slate-600 border border-input-border dark:border-slate-500 rounded-full text-sm placeholder-textMuted dark:placeholder-slate-400 text-textHeader dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-input-focus-ring dark:focus:ring-primary"
              />
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {error && (
            <div className="text-center py-10 text-red-500 dark:text-red-400">
              <p>Error: {error}</p>
              <button onClick={fetchRetailers} className="mt-2 px-3 py-1 bg-primary text-white rounded-md text-sm">Reintentar</button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-slate-600">
                  <tr>
                    {["Imagen", "Comercio", "URL del Comercio", "País", "Acciones"].map(header => (
                      <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-semibold text-textMuted dark:text-slate-300 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-card dark:bg-slate-700 divide-y divide-contentBorder dark:divide-slate-600">
                  {filteredRetailers.map(retailer => (
                    <tr key={retailer.id} className="hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <img src={retailer.logoUrl || `https://via.placeholder.com/40?text=${retailer.name.charAt(0)}`} alt={retailer.name} className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-slate-500" />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-textHeader dark:text-slate-100">{retailer.name}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted dark:text-slate-300">
                        <a href={retailer.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline dark:hover:text-primary-light">
                          {retailer.url}
                        </a>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted dark:text-slate-300">{retailer.codigo_pais || 'N/A'}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm space-x-3">
                        <button
                          disabled // Functionality not implemented due to backend limitations
                          className="text-textMuted dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Editar (deshabilitado)"
                          aria-label="Editar (deshabilitado)"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          disabled // Functionality not implemented due to backend limitations
                          className="text-textMuted dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar (deshabilitado)"
                          aria-label="Eliminar (deshabilitado)"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRetailers.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-textMuted dark:text-slate-400">
                        No se encontraron comercios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
           {/* Removed the note about disabled functionality as per request */}
        </div>
      </Card>
    </div>
  );
};

export default RetailersPage;
