
import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../constants';
import * as apiService from '../../services/apiService';
import LoadingSpinner from './LoadingSpinner';

interface ApiDiagnosticProps {
  showDetails?: boolean;
}

const ApiDiagnostic: React.FC<ApiDiagnosticProps> = ({ showDetails = false }) => {
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);

  const checkApiConnection = useCallback(async () => {
    setApiStatus('loading');
    setApiMessage('Verificando conexión con la API...');
    setDetails(null);
    try {
      // Using getTiendas as a simple check.
      const tiendas = await apiService.getTiendas();
      setApiStatus('success');
      setApiMessage('Conexión con la API exitosa.');
      if (showDetails) {
        setDetails({ response: `Se encontraron ${tiendas.length} tiendas.` });
      }
    } catch (error: any) {
      setApiStatus('error');
      const errorMessage = error.message || 'Error desconocido al conectar con la API.';
      setApiMessage(`Error al conectar con la API: ${errorMessage}`);
      if (showDetails) {
        setDetails({ error: error.toString(), fullError: error });
      }
      console.error("API Diagnostic Error:", error);
    }
  }, [showDetails]);

  useEffect(() => {
    checkApiConnection();
  }, [checkApiConnection]);

  const getStatusColorClasses = () => {
    switch (apiStatus) {
      case 'loading':
        return 'text-blue-600 dark:text-blue-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-textMuted dark:text-slate-400';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <div>
          <h4 className="text-md font-semibold text-textHeader dark:text-slate-200">Diagnóstico de API</h4>
          <p className="text-xs text-textMuted dark:text-slate-400">
            URL Base: <code className="bg-gray-100 dark:bg-slate-600 p-1 rounded text-xs select-all">{API_BASE_URL}</code>
          </p>
        </div>
        <button
          onClick={checkApiConnection}
          disabled={apiStatus === 'loading'}
          className="mt-2 sm:mt-0 px-3 py-1.5 bg-primary hover:bg-opacity-90 text-white text-xs font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-offset-slate-800 disabled:opacity-50"
          aria-label="Probar conexión con la API"
        >
          {apiStatus === 'loading' ? (
            <LoadingSpinner size="sm" color="text-white" className="mr-1.5 inline-block" />
          ) : null}
          {apiStatus === 'loading' ? 'Verificando...' : 'Reintentar Test'}
        </button>
      </div>

      <div className={`p-3 rounded-md border ${
        apiStatus === 'success' ? 'bg-green-50 dark:bg-green-800 dark:bg-opacity-30 border-green-300 dark:border-green-600' :
        apiStatus === 'error' ? 'bg-red-50 dark:bg-red-800 dark:bg-opacity-30 border-red-300 dark:border-red-600' :
        apiStatus === 'loading' ? 'bg-blue-50 dark:bg-blue-800 dark:bg-opacity-30 border-blue-300 dark:border-blue-600' :
        'bg-gray-50 dark:bg-slate-700 border-gray-300 dark:border-slate-600'
      }`}
      role="alert"
      aria-live="assertive"
      >
        <div className="flex items-center">
          {apiStatus === 'loading' && <LoadingSpinner size="sm" color={getStatusColorClasses()} className="mr-2 flex-shrink-0" />}
          {apiStatus === 'success' && <span className="text-xl mr-2 flex-shrink-0" aria-hidden="true">✅</span>}
          {apiStatus === 'error' && <span className="text-xl mr-2 flex-shrink-0" aria-hidden="true">❌</span>}
          <p className={`text-sm font-medium ${getStatusColorClasses()}`}>
            {apiMessage || 'Estado de la API no verificado.'}
          </p>
        </div>
      </div>

      {showDetails && details && (
        <div className="mt-3">
          <h5 className="text-xs font-semibold text-textMuted dark:text-slate-300 mb-1">Detalles del Diagnóstico:</h5>
          <pre className="bg-gray-100 dark:bg-slate-900 p-3 rounded-md text-xs text-textHeader dark:text-slate-200 overflow-x-auto max-h-48">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiDiagnostic;