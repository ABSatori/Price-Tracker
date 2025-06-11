import { useState, useCallback, useRef, useEffect } from 'react';
import * as apiService from '../services/apiService';
import { BackendPriceHistory } from '../types';

type EstadoActualizacion = 'idle' | 'consultando' | 'actualizando' | 'completado' | 'error';

interface PriceUpdateResult {
  precio_anterior?: number;
  precio_nuevo?: number;
  diferencia?: number;
  porcentaje_cambio?: number;
  timestamp_anterior?: string;
  timestamp_nuevo?: string;
}

interface UsePriceUpdaterReturn {
  estado: EstadoActualizacion;
  precioActual: number | null;
  ultimaActualizacion: string | null;
  resultado: PriceUpdateResult | null;
  feedback: string | null;
  consultarYActualizarPrecio: (id_producto: number) => Promise<void>;
  consultarPrecioActual: (id_producto: number) => Promise<void>;
  reset: () => void;
  estaConsultando: boolean; // Combined loading state
}

export const usePriceUpdater = (): UsePriceUpdaterReturn => {
  const [estado, setEstado] = useState<EstadoActualizacion>('idle');
  const [precioActual, setPrecioActual] = useState<number | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
  const [resultado, setResultado] = useState<PriceUpdateResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup function to abort ongoing requests when the component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const prepareForRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Abort previous request
    }
    abortControllerRef.current = new AbortController(); // Create a new controller for the new request
  };


  const consultarPrecioActual = useCallback(async (id_producto: number) => {
    prepareForRequest();
    setEstado('consultando');
    setFeedback('Consultando precio actual...');
    setResultado(null); // Clear previous comparison results

    try {
      const historialResponse = await apiService.getHistorialPrecios({ 
        id_producto: id_producto.toString(), 
        limit: 1 
      });
      // TODO: Add signal to fetchAPI in apiService.ts and pass abortControllerRef.current.signal

      if (abortControllerRef.current?.signal.aborted) return;

      if (historialResponse && historialResponse.length > 0) {
        const ultimoPrecio = historialResponse[0];
        setPrecioActual(ultimoPrecio.precio);
        setUltimaActualizacion(ultimoPrecio.capturado_en);
        setEstado('completado');
        setFeedback(`Precio actual: $${ultimoPrecio.precio.toFixed(2)} MXN (Consultado de BD)`);
      } else {
        setPrecioActual(null);
        setUltimaActualizacion(null);
        setEstado('completado');
        setFeedback('No se encontró historial de precios para este producto en la BD.');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Consulta de precio abortada');
        // Optionally set feedback or state indicating abortion
        // setFeedback('Consulta cancelada.');
        // setEstado('idle'); // Or some other appropriate state
        return;
      }
      console.error('Error consultando precio:', error);
      setEstado('error');
      setFeedback(`Error al consultar precio: ${error.message}`);
    }
  }, []);

  const consultarYActualizarPrecio = useCallback(async (id_producto: number) => {
    prepareForRequest();
    setEstado('consultando'); // Initial state: getting old price
    setFeedback('Obteniendo precio anterior de la base de datos...');
    setResultado(null);
    let precioAnteriorObj: BackendPriceHistory | null = null;

    try {
      // 1. Obtener precio anterior
      const historialAnterior = await apiService.getHistorialPrecios({ 
        id_producto: id_producto.toString(), 
        limit: 1 
      });
      if (abortControllerRef.current?.signal.aborted) return;

      if (historialAnterior.length > 0) {
        precioAnteriorObj = historialAnterior[0];
        setFeedback('Precio anterior obtenido. Simulando consulta a comercio...');
      } else {
        setFeedback('No hay precio anterior. Simulando consulta a comercio...');
      }
      
      setEstado('actualizando'); // State: simulating external call

      // 2. Simular consulta a la fuente externa (esto puede tardar)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
      if (abortControllerRef.current?.signal.aborted) return;

      // 3. Simular nuevo precio 
      const precioAnteriorVal = precioAnteriorObj ? precioAnteriorObj.precio : null;
      let nuevoPrecioSimulado = precioAnteriorVal 
        ? precioAnteriorVal + (Math.random() - 0.5) * precioAnteriorVal * 0.15 // Variación del ±15%
        : Math.random() * 150 + 20; // Precio aleatorio si no hay anterior
      nuevoPrecioSimulado = parseFloat(nuevoPrecioSimulado.toFixed(2));

      setFeedback('Nuevo precio simulado obtenido. Registrando en base de datos...');

      // 4. Registrar nuevo precio en la base de datos
      await apiService.addHistorialPrecio({
        id_producto,
        precio: nuevoPrecioSimulado,
        moneda: 'MXN',
        etiqueta_promo: 'Actualización Manual Simulada' // Indicate source
      });
      if (abortControllerRef.current?.signal.aborted) return;
      
      const timestampNuevo = new Date().toISOString();

      // 5. Calcular resultados
      const resultadoActualizacion: PriceUpdateResult = {
        precio_anterior: precioAnteriorVal ?? undefined,
        precio_nuevo: nuevoPrecioSimulado,
        diferencia: precioAnteriorVal ? nuevoPrecioSimulado - precioAnteriorVal : undefined,
        porcentaje_cambio: precioAnteriorVal ? ((nuevoPrecioSimulado - precioAnteriorVal) / precioAnteriorVal) * 100 : undefined,
        timestamp_anterior: precioAnteriorObj?.capturado_en,
        timestamp_nuevo: timestampNuevo
      };

      setResultado(resultadoActualizacion);
      setPrecioActual(nuevoPrecioSimulado);
      setUltimaActualizacion(timestampNuevo);
      setEstado('completado');
      
      const cambio = resultadoActualizacion.diferencia;
      const simboloCambio = cambio && cambio > 0 ? '↗️ (Subió)' : cambio && cambio < 0 ? '↘️ (Bajó)' : '➡️ (Sin cambio)';
      const textoCambio = cambio ? ` ${simboloCambio} ${cambio > 0 ? '+' : ''}${cambio.toFixed(2)}` : '';
      
      setFeedback(`Precio actualizado (simulado): $${nuevoPrecioSimulado.toFixed(2)} MXN.${textoCambio}`);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Actualización de precio abortada');
        // setFeedback('Actualización cancelada.');
        // setEstado('idle');
        return;
      }
      console.error('Error actualizando precio:', error);
      setEstado('error');
      setFeedback(`Error al actualizar precio: ${error.message}`);
    }
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setEstado('idle');
    setPrecioActual(null);
    setUltimaActualizacion(null);
    setResultado(null);
    setFeedback(null);
  }, []);

  const estaConsultando = estado === 'consultando' || estado === 'actualizando';

  return {
    estado,
    precioActual,
    ultimaActualizacion,
    resultado,
    feedback,
    consultarYActualizarPrecio,
    consultarPrecioActual,
    reset,
    estaConsultando
  };
};
