
import { useState, useCallback } from 'react';
import { ScrapingDataPayload, CategoryInfo, BrandInfo, RetailerInfo } from '../types';
import * as apiService from '../services/apiService';

type EstadoProceso = 'idle' | 'enviando' | 'obteniendo_ids' | 'creando_producto' | 'creando_historial' | 'ok' | 'err' | 'skipped';

interface HookReturn {
  estado: EstadoProceso;
  feedback: string | null;
  enviar: (payload: ScrapingDataPayload) => Promise<void>;
  reset: () => void;
}

// Helper to get or create entities (tienda, categoria, marca)
async function getOrCreateEntityId(
  entityName: 'tienda' | 'categoria' | 'marca',
  name: string,
  additionalData?: any
): Promise<number> {
  if (!name || name.trim() === '' || name.toLowerCase() === 'n/a') {
    throw new Error(`Nombre para ${entityName} no puede ser vacío o N/A.`);
  }

  let existingEntity: any[] = [];
  try {
    if (entityName === 'tienda') {
      existingEntity = await apiService.getTiendas({ nombre: name });
      if (existingEntity.length > 0) return parseInt(existingEntity[0].id);
      const newTienda = await apiService.addTienda({ name, url: additionalData?.urlComercio || `http://${name.toLowerCase().replace(/\s/g, '')}.com`, codigo_pais: 'MX' });
      return newTienda.id;
    } else if (entityName === 'categoria') {
      existingEntity = await apiService.getCategorias({ nombre: name });
       if (existingEntity.length > 0) return existingEntity[0].id_categoria;
      const newCategoria = await apiService.addCategoria(name);
      return newCategoria.id;
    } else if (entityName === 'marca') {
      existingEntity = await apiService.getMarcas({ nombre: name });
      if (existingEntity.length > 0) return existingEntity[0].id_marca;
      const newMarca = await apiService.addMarca(name);
      return newMarca.id;
    }
  } catch (error: any) {
    console.error(`Error obteniendo o creando ${entityName} '${name}':`, error);
    throw new Error(`Fallo al procesar ${entityName} '${name}': ${error.message}`);
  }
  throw new Error(`Entidad ${entityName} '${name}' no encontrada y no se pudo crear.`);
}


export const useDataSender = (): HookReturn => {
  const [estado, setEstado] = useState<EstadoProceso>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);

  const enviar = useCallback(async (payload: ScrapingDataPayload) => {
    setEstado('enviando');
    setFeedback('Iniciando proceso de envío de datos...');
    console.log('Payload de scraping para backend:', payload);

    if (!payload.producto || !payload.comercio || typeof payload.precio === 'undefined' || payload.precio === null) {
        setEstado('err');
        setFeedback('Error: Producto, comercio y precio son obligatorios para registrar.');
        return;
    }
    
    let id_tienda: number;
    let id_categoria: number;
    let id_marca: number;
    let id_producto: number;

    try {
      setEstado('obteniendo_ids');
      setFeedback('Verificando IDs de tienda, categoría y marca...');

      id_tienda = await getOrCreateEntityId('tienda', payload.comercio, { urlComercio: payload.urlComercio });
      // For category and brand, use provided or default to 'General' if empty and it's allowed.
      // For this example, we'll assume they are provided or a default is acceptable for backend.
      id_categoria = await getOrCreateEntityId('categoria', payload.categoria || 'General');
      id_marca = await getOrCreateEntityId('marca', payload.marca || 'Desconocida');
      
      setFeedback(`IDs: Tienda=${id_tienda}, Cat=${id_categoria}, Marca=${id_marca}. Creando producto...`);
      setEstado('creando_producto');

      // Attempt to parse volumen_ml from variante or producto
      let volumen_ml: number | undefined = undefined;
      const volumenMatch = (payload.variante || payload.producto).match(/(\d+)\s*(ml|l|g|kg)/i);
      if (volumenMatch) {
        const amount = parseInt(volumenMatch[1]);
        const unit = volumenMatch[2].toLowerCase();
        if (unit === 'l' || unit === 'kg') {
          volumen_ml = amount * 1000;
        } else {
          volumen_ml = amount;
        }
      }

      const productoBackendData = {
        id_tienda,
        id_categoria,
        id_marca,
        nombre: payload.producto, // Main product name
        sabor: payload.sabor || undefined,
        volumen_ml: volumen_ml,
        upc: payload.upc || undefined,
        sku: payload.sku || undefined,
        url_producto: payload.urlProducto || undefined,
      };
      
      const productoCreado = await apiService.addProducto(productoBackendData);
      id_producto = productoCreado.id;

      setFeedback(`Producto '${payload.producto}' creado/actualizado con ID: ${id_producto}. Registrando precio...`);
      setEstado('creando_historial');
      
      const historialPrecioData = {
        id_producto,
        precio: payload.precio,
        moneda: payload.moneda || 'MXN',
        etiqueta_promo: payload.etiqueta_promo || undefined,
      };

      await apiService.addHistorialPrecio(historialPrecioData);

      setEstado('ok');
      setFeedback(`¡Datos de ${payload.producto} en ${payload.comercio} enviados y registrados exitosamente! Precio: ${payload.precio}`);

    } catch (error: any) {
      console.error("Error en el proceso de envío:", error);
      setEstado('err');
      setFeedback(`Error: ${error.message}. No se pudieron registrar los datos.`);
    }
  }, []);

  const reset = useCallback(() => {
    setEstado('idle');
    setFeedback(null);
  }, []);

  return { estado, feedback, enviar, reset };
};