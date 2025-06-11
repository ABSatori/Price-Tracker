
import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useDataSender } from '../hooks/useDataSender';
import { ScrapingDataPayload } from '../types';
import { ChevronLeftIcon, SparklesIcon } from '../components/icons/SidebarIcons';

// Componente de input libre reutilizable
const FreeInput: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id: string;
  disabled?: boolean;
  // 'required' prop removed from here as it's no longer used for validation in this specific page
}> = ({ label, value, onChange, placeholder, id, disabled = false }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-textMuted dark:text-slate-300 mb-0.5">
      {label}
    </label>
    <input
      type="text"
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="mt-1 block w-full p-2.5 border border-input-border dark:border-slate-500 bg-card dark:bg-slate-600 rounded-md text-sm text-textHeader dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-input-focus-ring dark:focus:ring-primary disabled:bg-gray-100 dark:disabled:bg-slate-500"
    />
  </div>
);

interface ScrapingIAPageProps {
  onNavigateBack: () => void;
}

const ScrapingIAPage: React.FC<ScrapingIAPageProps> = ({ onNavigateBack }) => {
  const [comercioInput, setComercioInput] = useState<string>('');
  const [productoInput, setProductoInput] = useState<string>('');
  const [varianteInput, setVarianteInput] = useState<string>('');
  const [urlComercioInput, setUrlComercioInput] = useState<string>('');
  const [urlProductoInput, setUrlProductoInput] = useState<string>('');
  const [marcaProductoInput, setMarcaProductoInput] = useState<string>('');
  const [categoriaInput, setCategoriaInput] = useState<string>('');
  const [unidadMedidaInput, setUnidadMedidaInput] = useState<string>('');
  const [saborProductoInput, setSaborProductoInput] = useState<string>('');
  const [skuDelProductoInput, setSkuDelProductoInput] = useState<string>('');
  const [upcDeProductoInput, setUpcDeProductoInput] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackUIMessage, setFeedbackUIMessage] = useState<string | null>(null);
  // isFormPrimarilyValid and its useEffect are removed

  const { estado: dataSenderStatus, enviar: sendScrapingData, feedback: dataSenderFeedback } = useDataSender();

  useEffect(() => {
    if (dataSenderFeedback && dataSenderStatus !== 'enviando' && dataSenderStatus !== 'idle') {
      setFeedbackUIMessage(dataSenderFeedback);
      setIsSubmitting(false);
      if (dataSenderStatus === 'ok' || dataSenderStatus === 'skipped') {
        setTimeout(() => {
          setFeedbackUIMessage(null);
        }, 4000);
      }
    }
  }, [dataSenderStatus, dataSenderFeedback]);

  const handleEnviarDatos = async () => {
    setIsSubmitting(true);
    setFeedbackUIMessage(null);

    // Validation for primarily valid form is removed.
    // We can add a check if ALL main fields are empty, though user wants them optional.
    if (comercioInput.trim() === '' && productoInput.trim() === '' && varianteInput.trim() === '') {
        setFeedbackUIMessage('Intenta proporcionar al menos un detalle (comercio, producto o variante) para la búsqueda IA.');
        setIsSubmitting(false);
        return;
    }


    setFeedbackUIMessage("IA procesando tu búsqueda libre...");

    const payload: ScrapingDataPayload = {
      comercio: comercioInput,
      producto: productoInput,
      variante: varianteInput,
      urlComercio: urlComercioInput,
      urlProducto: urlProductoInput,
      marca: marcaProductoInput,
      categoria: categoriaInput,
      sku: skuDelProductoInput,
      upc: upcDeProductoInput,
      sabor: saborProductoInput,
      unidadMedida: unidadMedidaInput,
    };

    await sendScrapingData(payload);
  };

  const handleLimpiarCampos = () => {
    setComercioInput('');
    setProductoInput('');
    setVarianteInput('');
    setUrlComercioInput('');
    setUrlProductoInput('');
    setMarcaProductoInput('');
    setCategoriaInput('');
    setUnidadMedidaInput('');
    setSaborProductoInput('');
    setSkuDelProductoInput('');
    setUpcDeProductoInput('');
    setIsSubmitting(false);
    setFeedbackUIMessage('Formulario limpiado.');
    setTimeout(() => setFeedbackUIMessage(null), 2000);
  };

  const getFeedbackClasses = () => {
    if (feedbackUIMessage) {
      if (isSubmitting && feedbackUIMessage.includes("IA procesando")) {
        return 'text-blue-700 bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300 dark:border-blue-700';
      }

      switch (dataSenderStatus) {
        case 'ok': return 'text-green-700 bg-green-100 border border-green-300 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300 dark:border-green-700';
        case 'err': return 'text-red-700 bg-red-100 border border-red-300 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-300 dark:border-red-700';
        case 'enviando': return 'text-blue-700 bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300 dark:border-blue-700';
        case 'skipped': return 'text-gray-700 bg-gray-100 border border-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500';
        default:
          if (feedbackUIMessage?.toLowerCase().includes('error') || 
              feedbackUIMessage?.toLowerCase().includes('proporcionar al menos un detalle') ||
              feedbackUIMessage?.toLowerCase().includes('requerido')) {
            return 'text-red-700 bg-red-100 border border-red-300 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-300 dark:border-red-700';
          }
          if (feedbackUIMessage?.toLowerCase().includes('limpiado')) {
            return 'text-green-700 bg-green-100 border border-green-300 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300 dark:border-green-700';
          }
          return 'text-gray-700 bg-gray-100 border border-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500';
      }
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <Card> {/* Card handles dark mode */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <div className="flex items-center mb-1">
                <SparklesIcon className="w-6 h-6 text-accent mr-2" />
                <h2 className="text-xl font-semibold text-textHeader dark:text-slate-100">Scraping IA (Búsqueda Libre)</h2>
              </div>
              <p className="text-sm text-textMuted dark:text-slate-400">Ingresa los detalles del producto y deja que la IA intente encontrarlo.</p>
            </div>
            <button
              onClick={onNavigateBack}
              className="flex items-center mt-3 sm:mt-0 px-4 py-2 bg-gray-200 dark:bg-slate-600 text-textHeader dark:text-slate-100 hover:bg-gray-300 dark:hover:bg-slate-500 text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 dark:focus:ring-offset-slate-800"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1.5"/>
              Volver a Scraping Manual
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 sm:p-6">
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-700 dark:to-orange-700 dark:bg-opacity-30 border border-amber-200 dark:border-amber-600 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400 dark:text-amber-300 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">⚡ Modo Experimental - Búsqueda Libre</h3>
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                  <p>
                    Este modo utiliza IA para intentar encontrar productos basándose en tu descripción.
                    <strong className="font-medium"> Los resultados pueden variar significativamente, podrían no coincidir con lo esperado, no encontrarse, o incluso generar errores durante la búsqueda.</strong>
                  </p>
                  <p className="mt-1">
                    💡 <strong>Consejo:</strong> Proporcionar más detalles (marca, tamaño, características específicas) puede mejorar las posibilidades de un hallazgo, pero no lo garantiza.
                  </p>
                </div>
              </div>
            </div>
          </div>
       
          <h3 className="text-lg font-medium text-textHeader dark:text-slate-100 mb-1">Información del Producto (Todo Opcional)</h3>
          <p className="text-sm text-textMuted dark:text-slate-400 mb-4">Ingresa cualquier detalle que tengas. La IA intentará usar la información proporcionada.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-6">
            <FreeInput label="Comercio/Tienda" value={comercioInput} onChange={(e) => setComercioInput(e.target.value)} placeholder="ej. Walmart, Soriana..." id="comercioInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
            <FreeInput label="Nombre del Producto" value={productoInput} onChange={(e) => setProductoInput(e.target.value)} placeholder="ej. Coca Cola Original" id="productoInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
            <FreeInput label="Variante/Tamaño" value={varianteInput} onChange={(e) => setVarianteInput(e.target.value)} placeholder="ej. 600ml, pack de 6" id="varianteInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
          </div>

          <div className="space-y-4 mb-6 pt-6 border-t border-contentBorder dark:border-slate-600">
            <h3 className="text-base font-medium text-textHeader dark:text-slate-100">Información Adicional (Opcional, ayuda a la IA)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FreeInput label="URL del Comercio" value={urlComercioInput} onChange={(e) => setUrlComercioInput(e.target.value)} placeholder="ej. https://www.soriana.com" id="urlComercioInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
              <FreeInput label="URL del Producto (si la conoces)" value={urlProductoInput} onChange={(e) => setUrlProductoInput(e.target.value)} placeholder="ej. https://super.walmart.com.mx/ip/..." id="urlProductoInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'}/>
              <FreeInput label="Marca" value={marcaProductoInput} onChange={(e) => setMarcaProductoInput(e.target.value)} placeholder="ej. Coca Cola Company" id="marcaProductoInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
              <FreeInput label="Categoría" value={categoriaInput} onChange={(e) => setCategoriaInput(e.target.value)} placeholder="ej. Refrescos, Lácteos" id="categoriaInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
              <FreeInput label="Sabor" value={saborProductoInput} onChange={(e) => setSaborProductoInput(e.target.value)} placeholder="ej. Limón, Original" id="saborProductoInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
              <FreeInput label="Unidad de Medida (si no en variante)" value={unidadMedidaInput} onChange={(e) => setUnidadMedidaInput(e.target.value)} placeholder="ej. ml, L, gr, kg" id="unidadMedidaInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
              <FreeInput label="SKU" value={skuDelProductoInput} onChange={(e) => setSkuDelProductoInput(e.target.value)} placeholder="ej. REF-C-355" id="skuDelProductoInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
              <FreeInput label="UPC/Código de Barras" value={upcDeProductoInput} onChange={(e) => setUpcDeProductoInput(e.target.value)} placeholder="ej. 750105530388" id="upcDeProductoInputIA" disabled={isSubmitting || dataSenderStatus === 'enviando'} />
            </div>
          </div>

          <div className="space-y-4 mb-6 pt-6 border-t border-contentBorder dark:border-slate-600">
            <h3 className="text-base font-medium text-textHeader dark:text-slate-100">Resultado del Scraping IA</h3>
            <div className="border border-contentBorder dark:border-slate-600 rounded-md p-4 bg-gray-50 dark:bg-slate-600">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="flex-1 mb-3 sm:mb-0">
                  <p className="text-sm text-textMuted dark:text-slate-300 mb-1">Precio estimado en {comercioInput || 'tienda seleccionada'}:</p>
                  <div className="bg-card dark:bg-slate-500 p-3 rounded-md border border-contentBorder dark:border-slate-500">
                    <span className="text-xl font-semibold text-textHeader dark:text-slate-100">MXN ---.--</span>
                    <p className="text-xs text-textMuted dark:text-slate-300 mt-1">El resultado será generado por IA tras el envío.</p>
                  </div>
                </div>
                <div className="ml-0 sm:ml-4 flex flex-col space-y-2 w-full sm:w-auto">
                  <button
                    onClick={handleEnviarDatos}
                    disabled={isSubmitting || dataSenderStatus === 'enviando'} // Button is always enabled unless submitting
                    className="w-full px-5 py-2.5 bg-blue-custom hover:bg-opacity-90 text-white text-sm font-medium rounded-md transition-colors disabled:bg-gray-300 dark:disabled:bg-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting || dataSenderStatus === 'enviando' ? (
                      <><LoadingSpinner size="sm" color="text-white" /><span className="ml-2">Procesando...</span></>
                    ) : 'Realizar Scraping IA'}
                  </button>
                  <button
                    onClick={handleLimpiarCampos}
                    disabled={isSubmitting || dataSenderStatus === 'enviando'}
                    className="w-full px-5 py-2.5 bg-gray-200 dark:bg-slate-500 hover:bg-gray-300 dark:hover:bg-slate-400 text-textHeader dark:text-slate-100 text-sm font-medium rounded-md transition-colors disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                  >
                    Limpiar Campos
                  </button>
                </div>
              </div>
            </div>
          </div>

          {feedbackUIMessage && (
            <div className="mt-6 pt-6 border-t border-contentBorder dark:border-slate-600">
              <p className={`text-sm p-3 rounded-md ${getFeedbackClasses()}`} role="alert" aria-live="assertive">
                {feedbackUIMessage}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ScrapingIAPage;