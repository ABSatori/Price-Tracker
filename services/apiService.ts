import { API_BASE_URL } from '../constants';
import { RetailerInfo, BackendProduct, BackendPriceHistory, ScrapingHistoryEntry, CategoryInfo, BrandInfo } from '../types';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API Service] Fetching: ${options.method || 'GET'} ${url}`);
  if (options.body) {
    console.log(`[API Service] Body:`, options.body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Añadir headers para CORS
        'Access-Control-Allow-Origin': '*',
        ...options.headers,
      },
      // Añadir mode para manejar CORS
      mode: 'cors',
    });

    console.log(`[API Service] Response status: ${response.status} for ${url}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON, use text
        const errorText = await response.text();
        console.error(`[API Service] Non-JSON error response:`, errorText);
        errorData = { message: errorText };
      }
      console.error(`[API Service] Error ${response.status} for ${url}:`, errorData);
      throw new Error(errorData?.error || errorData?.message || `HTTP error ${response.status}`);
    }
    
    // For 204 No Content or if content-type is not application/json
    if (response.status === 204 || !response.headers.get("content-type")?.includes("application/json")) {
        console.log(`[API Service] Success response (204 or non-JSON) for ${url}`);
        return {} as T; 
    }
    
    const data = await response.json() as T;
    console.log(`[API Service] Success JSON response for ${url}:`, data);
    return data;
  } catch (error: any) {
    console.error(`[API Service] Network or parsing error for ${url}:`, error);
    // Añadir más información de debug
    if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
      console.error(`[API Service] Critical Fetch Error: Possible CORS misconfiguration on server, network issue, or invalid URL for ${url}. Check server logs and CORS headers ('Access-Control-Allow-Origin').`);
    }
    throw error; // Re-throw to be caught by caller
  }
}

// --- Tiendas (Retailers) ---
export const getTiendas = async (params?: { nombre?: string; id_tienda?: string; codigo_pais?: string }): Promise<RetailerInfo[]> => {
  const queryParams = new URLSearchParams();
  if (params?.nombre) queryParams.append('nombre', params.nombre);
  if (params?.id_tienda) queryParams.append('id_tienda', params.id_tienda);
  if (params?.codigo_pais) queryParams.append('codigo_pais', params.codigo_pais);
  
  const tiendasBackend = await fetchAPI<any[]>(`/tiendas?${queryParams.toString()}`);
  return tiendasBackend.map(tienda => ({
    id: String(tienda.id_tienda), // Ensure ID is string for frontend consistency
    name: tienda.nombre,
    url: tienda.url_base,
    codigo_pais: tienda.codigo_pais,
    // logoUrl can be constructed or fetched separately if needed
  }));
};

export const addTienda = async (tiendaData: { name: string; url: string; codigo_pais?: string }): Promise<{ message: string; id: number }> => {
  return fetchAPI<{ message: string; id: number }>('/tiendas', {
    method: 'POST',
    body: JSON.stringify({
        nombre: tiendaData.name,
        url_base: tiendaData.url,
        codigo_pais: tiendaData.codigo_pais
    }),
  });
};

// --- Categorias ---
export const getCategorias = async (params?: { nombre?: string }): Promise<CategoryInfo[]> => {
  const queryParams = new URLSearchParams();
  if (params?.nombre) queryParams.append('nombre', params.nombre);
  return fetchAPI<CategoryInfo[]>(`/categorias?${queryParams.toString()}`);
};

export const addCategoria = async (nombre: string): Promise<{ message: string; id: number }> => {
  return fetchAPI<{ message: string; id: number }>('/categorias', {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  });
};

// --- Marcas ---
export const getMarcas = async (params?: { nombre?: string }): Promise<BrandInfo[]> => {
  const queryParams = new URLSearchParams();
  if (params?.nombre) queryParams.append('nombre', params.nombre);
  return fetchAPI<BrandInfo[]>(`/marcas?${queryParams.toString()}`);
};

export const addMarca = async (nombre: string): Promise<{ message: string; id: number }> => {
  return fetchAPI<{ message: string; id: number }>('/marcas', {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  });
};

// --- Productos ---
export const getProductos = async (params?: { id_producto?: string; id_tienda?: string; nombre?: string }): Promise<BackendProduct[]> => {
  const queryParams = new URLSearchParams();
  if (params?.id_producto) queryParams.append('id_producto', params.id_producto);
  if (params?.id_tienda) queryParams.append('id_tienda', params.id_tienda);
  if (params?.nombre) queryParams.append('nombre', params.nombre);
  return fetchAPI<BackendProduct[]>(`/productos?${queryParams.toString()}`);
};

export const addProducto = async (productoData: {
  id_tienda: number;
  id_categoria: number;
  id_marca: number;
  nombre: string;
  sabor?: string;
  volumen_ml?: number;
  upc?: string;
  sku?: string;
  url_producto?: string;
}): Promise<{ message: string; id: number }> => {
  return fetchAPI<{ message: string; id: number }>('/productos', {
    method: 'POST',
    body: JSON.stringify(productoData),
  });
};


// --- Historial de Precios ---
// Maps backend response to frontend ScrapingHistoryEntry
function mapBackendPriceHistoryToScrapingHistoryEntry(
    priceEntry: BackendPriceHistory,
    productDetails?: BackendProduct 
  ): Omit<ScrapingHistoryEntry, 'id_producto'> & {id_producto: number} { 
    return {
      id: String(priceEntry.id_precio),
      id_producto: priceEntry.id_producto, 
      comercio: productDetails?.nombre_tienda || 'N/A',
      categoria: productDetails?.nombre_categoria || 'N/A',
      producto: productDetails?.nombre || 'Producto Desconocido', 
      upc: productDetails?.upc || null,
      sku: productDetails?.sku || null,
      precio: priceEntry.precio,
      fechaHora: new Date(priceEntry.capturado_en).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
    };
}


export const getHistorialPrecios = async (params: { id_producto: string; limit?: number }): Promise<BackendPriceHistory[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('id_producto', params.id_producto);
  if (params.limit) queryParams.append('limit', String(params.limit));
  
  return fetchAPI<BackendPriceHistory[]>(`/historial-precios?${queryParams.toString()}`);
};

export const getAllHistorialPrecios = async (limit?: number): Promise<BackendPriceHistory[]> => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', String(limit));
  
  console.log(`[API Service] Fetching all price history with limit: ${limit || 'none'}`);
  return fetchAPI<BackendPriceHistory[]>(`/historial-precios?${queryParams.toString()}`);
};

export const addHistorialPrecio = async (historialData: {
  id_producto: number;
  precio: number;
  moneda?: string;
  etiqueta_promo?: string;
}): Promise<{ message: string; id: number }> => {
  return fetchAPI<{ message: string; id: number }>('/historial-precios', {
    method: 'POST',
    body: JSON.stringify(historialData),
  });
};


// --- Combined History for List Page ---
export const getScrapingHistoryList = async (queryParams?: URLSearchParams): Promise<ScrapingHistoryEntry[]> => {
  console.log(`[API Service] getScrapingHistoryList called with params:`, queryParams?.toString());
  
  try {
    // 1. Fetch all products
    const products = await getProductos(); 
    console.log(`[API Service] Fetched ${products.length} products for history list`);
    
    if (products.length === 0) {
      console.log(`[API Service] No products found, returning empty history list`);
      return [];
    }

    // 2. Fetch all price history entries
    const allPriceHistory = await fetchAPI<BackendPriceHistory[]>(`/historial-precios?limit=1000`); // Example limit
    console.log(`[API Service] Fetched ${allPriceHistory.length} total price history entries`);

    // 3. Create a map of products by ID for efficient lookup
    const productMap = new Map<number, BackendProduct>();
    products.forEach(product => {
      productMap.set(product.id_producto, product);
    });

    // 4. Determine the latest price entry for each product
    const latestPriceMap = new Map<number, BackendPriceHistory>();
    allPriceHistory.forEach(priceEntry => {
      const existingEntry = latestPriceMap.get(priceEntry.id_producto);
      if (!existingEntry || new Date(priceEntry.capturado_en) > new Date(existingEntry.capturado_en)) {
        latestPriceMap.set(priceEntry.id_producto, priceEntry);
      }
    });
    console.log(`[API Service] Determined latest prices for ${latestPriceMap.size} products`);

    // 5. Combine product details with their latest price entry
    const historyList: ScrapingHistoryEntry[] = [];
    latestPriceMap.forEach((priceEntry, productId) => {
      const product = productMap.get(productId);
      if (product) { // Ensure product details exist for the price entry
        historyList.push(
          mapBackendPriceHistoryToScrapingHistoryEntry(priceEntry, product) as ScrapingHistoryEntry
        );
      }
    });

    console.log(`[API Service] Constructed ${historyList.length} entries for scraping history list`);
    
    // Sort by date descending. Note: Directly using new Date() on a formatted string like 'DD/MM/YYYY, HH:MM AM/PM' 
    // might lead to parsing inconsistencies across browsers or locales. 
    // A dedicated parsing function (like the previous 'parseMexicanDateString') is generally more robust.
    return historyList.sort((a, b) => {
        // Attempting direct parsing, be aware of potential issues.
        const dateA = new Date(a.fechaHora.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')); // Try MM/DD/YYYY
        const dateB = new Date(b.fechaHora.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')); // Try MM/DD/YYYY
        return dateB.getTime() - dateA.getTime();
    });
    
  } catch (error) {
    console.error(`[API Service] Error in getScrapingHistoryList:`, error);
    throw error; // Propagate error to be handled by the caller
  }
};


// --- Snapshot Existencia ---
export const getSnapshotExistencia = async (params: { id_producto: string; limit?: number }): Promise<any[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('id_producto', params.id_producto);
  if (params.limit) queryParams.append('limit', String(params.limit));
  return fetchAPI<any[]>(`/snapshot-existencia?${queryParams.toString()}`);
};

export const addSnapshotExistencia = async (snapshotData: {id_producto: number; en_existencia: boolean; nivel_stock?: number}): Promise<any> => {
    return fetchAPI<any>('/snapshot-existencia', {
        method: 'POST',
        body: JSON.stringify(snapshotData)
    });
};

// --- Tareas Scraping ---
export const getTareasScraping = async (params?: { id_tienda?: string; estado?: string; limit?: number }): Promise<any[]> => {
  const queryParams = new URLSearchParams();
  if (params?.id_tienda) queryParams.append('id_tienda', params.id_tienda);
  if (params?.estado) queryParams.append('estado', params.estado);
  if (params?.limit) queryParams.append('limit', String(params.limit));
  return fetchAPI<any[]>(`/tareas-scraping?${queryParams.toString()}`);
};

export const addTareaScraping = async (tareaData: any): Promise<any> => {
    return fetchAPI<any>('/tareas-scraping', {
        method: 'POST',
        body: JSON.stringify(tareaData)
    });
};

// --- NEW: Price Update Functions ---
export const actualizarPrecioAsync = async (id_producto: number): Promise<{
  precio_anterior?: number;
  precio_nuevo: number;
  diferencia?: number;
  porcentaje_cambio?: number;
  timestamp_anterior?: string;
  timestamp_nuevo: string;
  message: string;
}> => {
  console.log(`[API Service] Iniciando actualización asíncrona de precio para producto ${id_producto}`);
  
  return fetchAPI<{
    precio_anterior?: number;
    precio_nuevo: number;
    diferencia?: number;
    porcentaje_cambio?: number;
    timestamp_anterior?: string;
    timestamp_nuevo: string;
    message: string;
  }>(`/productos/${id_producto}/actualizar-precio`, {
    method: 'POST',
  });
};

export const consultarPrecioActualizado = async (id_producto: number): Promise<{
  precio: number;
  capturado_en: string;
  id_precio: number;
  moneda: string;
  etiqueta_promo?: string;
}> => {
  console.log(`[API Service] Consultando precio actualizado para producto ${id_producto}`);
  
  return fetchAPI<{
    precio: number;
    capturado_en: string;
    id_precio: number;
    moneda: string;
    etiqueta_promo?: string;
  }>(`/productos/${id_producto}/precio-actual`);
};

export const iniciarScrapingPrecio = async (id_producto: number, opciones?: {
  forzar_actualizacion?: boolean;
  timeout_segundos?: number;
}): Promise<{
  tarea_id: string;
  estado: 'INICIADO' | 'EN_PROGRESO' | 'COMPLETADO' | 'ERROR';
  mensaje: string;
  tiempo_estimado_segundos?: number;
}> => {
  console.log(`[API Service] Iniciando scraping de precio para producto ${id_producto}`);
  
  return fetchAPI<{
    tarea_id: string;
    estado: 'INICIADO' | 'EN_PROGRESO' | 'COMPLETADO' | 'ERROR';
    mensaje: string;
    tiempo_estimado_segundos?: number;
  }>(`/productos/${id_producto}/scraping-precio`, {
    method: 'POST',
    body: JSON.stringify(opciones || {}),
  });
};

export const verificarEstadoScraping = async (tarea_id: string): Promise<{
  estado: 'INICIADO' | 'EN_PROGRESO' | 'COMPLETADO' | 'ERROR';
  progreso_porcentaje?: number;
  precio_encontrado?: number;
  mensaje: string;
  tiempo_transcurrido_segundos: number;
}> => {
  console.log(`[API Service] Verificando estado de scraping para tarea ${tarea_id}`);
  
  return fetchAPI<{
    estado: 'INICIADO' | 'EN_PROGRESO' | 'COMPLETADO' | 'ERROR';
    progreso_porcentaje?: number;
    precio_encontrado?: number;
    mensaje: string;
    tiempo_transcurrido_segundos: number;
  }>(`/scraping/estado/${tarea_id}`);
};

// --- ENHANCED: Get latest price for product with more details ---
export const getUltimoPrecioPorProducto = async (id_producto: number): Promise<BackendPriceHistory & {
  tiempo_desde_ultima_actualizacion_horas: number;
  necesita_actualizacion: boolean;
}> => {
  return fetchAPI<BackendPriceHistory & {
    tiempo_desde_ultima_actualizacion_horas: number;
    necesita_actualizacion: boolean;
  }>(`/historial-precios/ultimo-por-producto?id_producto=${id_producto}&incluir_metadatos=true`);
};
