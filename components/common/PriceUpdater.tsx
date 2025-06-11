import React, { useEffect, useState } from 'react';
import { usePriceUpdater } from '../../hooks/usePriceUpdater';
import LoadingSpinner from './LoadingSpinner'; // Assuming LoadingSpinner is in the same directory or accessible path

interface PriceUpdaterProps {
  id_producto: number;
  nombreProducto?: string;
  autoUpdate?: boolean; 
  showUpdateButton?: boolean; 
  className?: string;
}

const PriceUpdater: React.FC<PriceUpdaterProps> = ({
  id_producto,
  nombreProducto = 'Producto',
  autoUpdate = false,
  showUpdateButton = true,
  className = ''
}) => {
  const {
    estado,
    precioActual,
    ultimaActualizacion,
    resultado,
    feedback,
    consultarYActualizarPrecio,
    consultarPrecioActual,
    reset,
    estaConsultando
  } = usePriceUpdater();

  const [ultimaConsultaLocal, setUltimaConsultaLocal] = useState<Date | null>(null);

  useEffect(() => {
    if (autoUpdate && id_producto) {
      consultarPrecioActual(id_producto);
      setUltimaConsultaLocal(new Date());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_producto, autoUpdate]); // Removed consultarPrecioActual from deps to avoid re-triggering due to its own re-creation

  const handleActualizarPrecio = async () => {
    if (!id_producto) return;
    await consultarYActualizarPrecio(id_producto);
    setUltimaConsultaLocal(new Date());
  };

  const handleConsultarPrecio = async () => {
    if (!id_producto) return;
    await consultarPrecioActual(id_producto);
    setUltimaConsultaLocal(new Date());
  };

  const formatearFecha = (fechaStr: string | null): string => {
    if (!fechaStr) return 'N/A';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short', // Using short month name
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return fechaStr; // Fallback if date is not parsable
    }
  };

  const getEstadoColorClasses = () => {
    switch (estado) {
      case 'consultando': return 'text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30';
      case 'actualizando': return 'text-orange-600 dark:text-orange-400 border-orange-500 bg-orange-50 dark:bg-orange-900 dark:bg-opacity-30';
      case 'completado': return 'text-green-600 dark:text-green-400 border-green-500 bg-green-50 dark:bg-green-900 dark:bg-opacity-30';
      case 'error': return 'text-red-600 dark:text-red-400 border-red-500 bg-red-50 dark:bg-red-900 dark:bg-opacity-30';
      default: return 'text-gray-600 dark:text-slate-400 border-gray-500 bg-gray-50 dark:bg-slate-600';
    }
  };
  
  const getCambioColorClasses = (diferencia?: number) => {
    if (diferencia === undefined || diferencia === null) return 'text-textHeader dark:text-slate-100';
    return diferencia > 0 ? 'text-red-500 dark:text-red-400' : 
           diferencia < 0 ? 'text-green-500 dark:text-green-400' : 
           'text-textHeader dark:text-slate-100';
  };


  return (
    <div className={`bg-card dark:bg-slate-700 rounded-xl shadow-lg border border-contentBorder dark:border-slate-600 p-5 sm:p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-4 border-b border-contentBorder dark:border-slate-600">
        <h3 className="text-lg font-semibold text-textHeader dark:text-slate-100 mb-2 sm:mb-0 truncate max-w-xs sm:max-w-sm md:max-w-md" title={nombreProducto}>
          💰 Precio - {nombreProducto}
        </h3>
        <div className="flex flex-wrap gap-2">
          {showUpdateButton && (
            <>
              <button
                onClick={handleConsultarPrecio}
                disabled={estaConsultando}
                className="px-3 py-1.5 text-xs sm:text-sm bg-blue-custom hover:bg-opacity-90 text-white rounded-md transition-colors disabled:bg-gray-400 dark:disabled:bg-slate-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                aria-label="Consultar precio actual de la base de datos"
              >
                {estaConsultando && estado === 'consultando' ? <LoadingSpinner size="sm" color="text-white" className="mr-1.5"/> : '📊'} Consultar DB
              </button>
              <button
                onClick={handleActualizarPrecio}
                disabled={estaConsultando}
                className="px-3 py-1.5 text-xs sm:text-sm bg-green-custom hover:bg-opacity-90 text-white rounded-md transition-colors disabled:bg-gray-400 dark:disabled:bg-slate-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                aria-label="Actualizar precio (simulado)"
              >
                 {estaConsultando && estado === 'actualizando' ? <LoadingSpinner size="sm" color="text-white" className="mr-1.5"/> : '🔄'} Actualizar
              </button>
            </>
          )}
          {estado !== 'idle' && (
            <button
              onClick={reset}
              disabled={estaConsultando}
              className="px-3 py-1.5 text-xs sm:text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors disabled:bg-gray-400 dark:disabled:bg-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Reiniciar estado del actualizador de precios"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Estado y Feedback */}
      {feedback && (
        <div className={`mb-4 p-3 rounded-lg border-l-4 ${getEstadoColorClasses()}`} role="status" aria-live="polite">
          <div className="text-sm font-medium flex items-center">
            {estaConsultando && <LoadingSpinner size="sm" className={`mr-2 ${getEstadoColorClasses().split(' ')[0]}`} />}
            <span>{feedback}</span>
          </div>
        </div>
      )}

      {/* Precio Actual */}
      <div className="mb-4 text-center sm:text-left">
        <span className="text-sm text-textMuted dark:text-slate-400 block mb-1">Precio Actual Registrado</span>
        {precioActual !== null ? (
            <div className="text-3xl sm:text-4xl font-bold text-textHeader dark:text-slate-100">
                ${precioActual.toFixed(2)} <span className="text-xl font-normal text-textMuted dark:text-slate-400">MXN</span>
            </div>
        ) : (
            <div className="text-2xl font-semibold text-textMuted dark:text-slate-500 py-2">
                --.-- MXN
            </div>
        )}
        {ultimaActualizacion && (
          <div className="text-xs text-textMuted dark:text-slate-500 mt-1">
            Última act. en BD: {formatearFecha(ultimaActualizacion)}
          </div>
        )}
      </div>

      {/* Resultado de Comparación */}
      {resultado && estado === 'completado' && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-600 rounded-lg border border-contentBorder dark:border-slate-500">
          <h4 className="font-semibold text-textHeader dark:text-slate-200 mb-2 text-sm">📈 Comparación de Precios (Tras Actualización Simulada)</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm">
            {resultado.precio_anterior !== undefined && (
              <div>
                <span className="text-textMuted dark:text-slate-300 block">Precio anterior:</span>
                <div className="font-semibold text-textHeader dark:text-slate-100">${resultado.precio_anterior.toFixed(2)} MXN</div>
                 {resultado.timestamp_anterior && <span className="text-xs text-textMuted dark:text-slate-500">({formatearFecha(resultado.timestamp_anterior)})</span>}
              </div>
            )}
            {resultado.precio_nuevo !== undefined && (
                 <div>
                <span className="text-textMuted dark:text-slate-300 block">Precio nuevo:</span>
                <div className="font-semibold text-textHeader dark:text-slate-100">${resultado.precio_nuevo.toFixed(2)} MXN</div>
                {resultado.timestamp_nuevo && <span className="text-xs text-textMuted dark:text-slate-500">({formatearFecha(resultado.timestamp_nuevo)})</span>}
              </div>
            )}
            {resultado.diferencia !== undefined && (
              <div className="col-span-2 sm:col-span-1">
                <span className="text-textMuted dark:text-slate-300 block">Diferencia:</span>
                <div className={`font-semibold ${getCambioColorClasses(resultado.diferencia)}`}>
                  {resultado.diferencia >= 0 ? '+' : ''}${resultado.diferencia.toFixed(2)} MXN
                </div>
              </div>
            )}
            {resultado.porcentaje_cambio !== undefined && (
              <div className="col-span-2 sm:col-span-1">
                <span className="text-textMuted dark:text-slate-300 block">Cambio Porcentual:</span>
                <div className={`font-semibold ${getCambioColorClasses(resultado.diferencia)}`}>
                  {resultado.porcentaje_cambio >= 0 ? '+' : ''}{resultado.porcentaje_cambio.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información Adicional Footer */}
      <div className="text-xs text-textMuted dark:text-slate-500 border-t border-contentBorder dark:border-slate-600 pt-3 mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <span className="mb-1 sm:mb-0">ID Producto: <span className="font-medium text-textHeader dark:text-slate-300">{id_producto}</span></span>
          {ultimaConsultaLocal && (
            <span>Última consulta local: {ultimaConsultaLocal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceUpdater;
