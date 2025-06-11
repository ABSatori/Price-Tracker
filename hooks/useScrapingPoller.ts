import { useState, useEffect, useCallback, useRef } from 'react';
import * as apiService from '../services/apiService';

interface ScrapingTaskState {
  tarea_id: string;
  estado: 'INICIADO' | 'EN_PROGRESO' | 'COMPLETADO' | 'ERROR';
  progreso_porcentaje?: number;
  precio_encontrado?: number;
  mensaje: string;
  tiempo_transcurrido_segundos: number;
}

interface UseScrapingPollerReturn {
  estadoActual: ScrapingTaskState | null;
  estaPolling: boolean;
  error: string | null;
  iniciarScraping: (id_producto: number, opciones?: { forzar_actualizacion?: boolean; timeout_segundos?: number }) => Promise<void>;
  detenerPolling: () => void;
  reiniciar: () => void;
}

export const useScrapingPoller = (
  intervaloPolling: number = 3000, // 3 segundos por defecto
  maxIntentos: number = 20 // máximo 20 intentos (1 minuto)
): UseScrapingPollerReturn => {
  const [estadoActual, setEstadoActual] = useState<ScrapingTaskState | null>(null);
  const [estaPolling, setEstaPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias para manejo de intervalos y control
  const intervalRef = useRef<number | null>(null);
  const intentosRef = useRef(0);
  const tareaIdRef = useRef<string | null>(null);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const detenerPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setEstaPolling(false);
    intentosRef.current = 0;
  }, []);

  const verificarEstado = useCallback(async (tareaId: string) => {
    try {
      const estado = await apiService.verificarEstadoScraping(tareaId);
      setEstadoActual({ ...estado, tarea_id: tareaId });
      setError(null);

      // Si la tarea se completó o hay error, detener polling
      if (estado.estado === 'COMPLETADO' || estado.estado === 'ERROR') {
        detenerPolling();
        return true; // Indica que el polling debe detenerse
      }

      return false; // Continuar polling
    } catch (err: any) {
      console.error('Error verificando estado de scraping:', err);
      intentosRef.current++;
      
      // Si excedemos el máximo de intentos, detener polling
      if (intentosRef.current >= maxIntentos) {
        setError(`Error de comunicación después de ${maxIntentos} intentos: ${err.message}`);
        detenerPolling();
        return true;
      }
      
      setError(`Error temporal: ${err.message} (intento ${intentosRef.current}/${maxIntentos})`);
      return false; // Continuar polling a pesar del error
    }
  }, [detenerPolling, maxIntentos]);

  const iniciarPolling = useCallback((tareaId: string) => {
    tareaIdRef.current = tareaId;
    setEstaPolling(true);
    setError(null);
    intentosRef.current = 0;

    // Verificar estado inmediatamente
    verificarEstado(tareaId).then(debeDetener => {
      if (debeDetener) return; // No iniciar intervalo si ya terminó
       // Configurar intervalo para verificaciones periódicas
        intervalRef.current = window.setInterval(async () => { // Use window.setInterval for clarity
        if (tareaIdRef.current) {
            const debeDetenerIntervalo = await verificarEstado(tareaIdRef.current);
            if (debeDetenerIntervalo) {
            return; // El polling ya se detuvo dentro de verificarEstado
            }
        }
        }, intervaloPolling);
    });

  }, [intervaloPolling, verificarEstado]);

  const iniciarScraping = useCallback(async (
    id_producto: number, 
    opciones?: { forzar_actualizacion?: boolean; timeout_segundos?: number }
  ) => {
    try {
      // Detener cualquier polling anterior
      detenerPolling();
      setError(null);
      setEstadoActual(null);

      // Iniciar nueva tarea de scraping
      const respuesta = await apiService.iniciarScrapingPrecio(id_producto, opciones);
      
      // Actualizar estado inicial
      setEstadoActual({
        tarea_id: respuesta.tarea_id,
        estado: respuesta.estado,
        mensaje: respuesta.mensaje,
        tiempo_transcurrido_segundos: 0,
        progreso_porcentaje: 0
      });

      // Iniciar polling solo si la tarea no se completó inmediatamente
      if (respuesta.estado !== 'COMPLETADO' && respuesta.estado !== 'ERROR') {
        iniciarPolling(respuesta.tarea_id);
      }

    } catch (err: any) {
      setError(`Error iniciando scraping: ${err.message}`);
      console.error('Error iniciando scraping:', err);
    }
  }, [detenerPolling, iniciarPolling]);

  const reiniciar = useCallback(() => {
    detenerPolling();
    setEstadoActual(null);
    setError(null);
    tareaIdRef.current = null;
  }, [detenerPolling]);

  return {
    estadoActual,
    estaPolling,
    error,
    iniciarScraping,
    detenerPolling,
    reiniciar
  };
};
