import { CatalogProduct, SmartSuggestionResponse, ExtractedProductDetails } from '../types';
import { AI_MODEL_TEXT, MOCK_API_KEY } from '../constants';

// API Key genérica para servicios de IA. En un entorno real, usar variables de entorno.
const API_KEY = (globalThis as any).process?.env?.AI_API_KEY || MOCK_API_KEY;

if (!API_KEY && !(globalThis as any).process?.env?.AI_API_KEY) {
  console.warn("AI API key is not set. Using mock key. Product suggestions will be limited.");
}

const generatePrompt = (query: string, storeName: string, catalogSubsetForPrompt: CatalogProduct[]): string => {
  return `
Dado el siguiente catálogo de productos para la tienda '${storeName}':
${JSON.stringify(catalogSubsetForPrompt)}

Y la siguiente consulta de búsqueda del usuario: '${query}'

Por favor, analiza la consulta y el catálogo. Tu objetivo es:
1.  Identificar si la consulta coincide EXACTAMENTE con un producto y variante en el catálogo.
    - Si es así, devuelve: { "status": "EXACT_MATCH", "match_details": { /* detalles del producto del catálogo */ }, "mensaje_usuario": "¡Encontrado! Tenemos este producto exacto en nuestro catálogo." }
2.  Si la consulta menciona un producto base que existe, pero la variante específica NO está O la consulta es AMBIGUA sobre la variante:
    - Devuelve: { "status": "VARIANT_SUGGESTION", "producto_base_identificado": "Nombre del producto base", "sugerencias_variantes_disponibles": [/* array de detalles de las variantes encontradas */], "mensaje_usuario": "Encontramos '\${producto_base_identificado}'. ¿Te refieres a alguna de estas variantes?" }
3.  Si la consulta parece tener un error tipográfico o una unidad de medida ligeramente incorrecta para un producto que SÍ existe:
    - Devuelve: { "status": "UNIT_CORRECTION_SUGGESTION", "match_details": { /* detalles del producto corregido del catálogo */ }, "mensaje_usuario": "Parece que podría haber un pequeño error en tu búsqueda. ¿Quizás quisiste decir esto?" }
4.  Si la consulta NO coincide con ningún producto en el catálogo, incluso de forma aproximada:
    - Devuelve: { "status": "NO_MATCH", "mensaje_usuario": "Hmm, los términos de tu búsqueda no coinciden con nuestro catálogo actual. ¿Te gustaría que intentemos procesar tu búsqueda '${query}' directamente en ${storeName}? Esto podría tomar un momento y los resultados no están garantizados." }

Consideraciones importantes:
- 'match_details' y los elementos en 'sugerencias_variantes_disponibles' deben tener la estructura: { "item_original": string, "tienda": string, "marca": string, "producto_base_corregido": string, "variante_corregida": string, "sabor_extraido": string, "upc": string }
- 'producto_base_corregido' es el nombre del producto sin la variante ni el sabor.
- 'variante_corregida' es la unidad de medida y cantidad (ej. '600 ml', '1 Litro').
- 'sabor_extraido' es el sabor si se puede identificar (ej. 'Limón', 'Original', 'N/A' si no aplica).
- 'item_original' es el string original del item en el catálogo.
- La tienda siempre será '${storeName}'.
- Se breve y directo en 'mensaje_usuario'.

Responde ÚNICAMENTE con el objeto JSON. Asegúrate que el JSON sea válido.
  `.trim();
};

// Simulación de llamada a servicio de IA genérico
const callAIService = async (prompt: string): Promise<string> => {
  // En un entorno real, aquí se haría la llamada a tu servicio de IA preferido
  // Por ejemplo: OpenAI, Claude, servicio local, etc.
  
  if (!API_KEY || API_KEY === MOCK_API_KEY) {
    console.warn("Using mock AI response due to missing API key.");
    // Respuesta simulada para testing
    return JSON.stringify({
      status: "NO_MATCH",
      mensaje_usuario: "Mock Response: Servicio de IA no configurado. Configura tu API key para obtener sugerencias inteligentes."
    });
  }
  
  // Aquí implementarías la llamada a tu servicio de IA preferido
  // Ejemplo genérico:
  /*
  const response = await fetch('YOUR_AI_SERVICE_ENDPOINT', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: AI_MODEL_TEXT,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
  */
  
  // Por ahora, retornamos una respuesta mock
  return JSON.stringify({
    status: "NO_MATCH",
    mensaje_usuario: "Servicio de IA no implementado. Implementa tu proveedor de IA preferido en aiService.ts"
  });
};

export const getSmartProductSuggestion = async (
  query: string,
  catalog: CatalogProduct[]
): Promise<SmartSuggestionResponse | null> => {
  if (!API_KEY || API_KEY === MOCK_API_KEY) {
    console.warn("Using mock AI response due to missing API key.");
    // Simulate a "NO_MATCH" response if using mock key and catalog is empty
     if (!catalog || catalog.length === 0) {
      return {
        status: "NO_MATCH",
        mensaje_usuario: `Mock Response: El catálogo está vacío para '${query}'. No se pueden generar sugerencias. Intenta agregar items al catálogo.`
      };
    }
    // Simulate a more generic NO_MATCH if catalog has items but still mocking
    return {
      status: "NO_MATCH",
      mensaje_usuario: `Mock Response (API Key not set): No se pudo encontrar '${query}'. ¿Quieres intentar la búsqueda directa?`
    };
  }
  
  if (!catalog || catalog.length === 0) {
    return {
      status: "NO_MATCH",
      mensaje_usuario: "El catálogo de productos está vacío. No se pueden generar sugerencias."
    };
  }

  // For simplicity, using the first store found in the catalog subset, or a default
  const storeName = catalog.length > 0 ? catalog[0].tienda : "la tienda seleccionada";
  const prompt = generatePrompt(query, storeName, catalog);

  try {
    const responseText = await callAIService(prompt);

    let jsonStr = responseText.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr) as SmartSuggestionResponse;
    
    // Basic validation of parsed data structure
    if (!parsedData.status || !parsedData.mensaje_usuario) {
        throw new Error("Respuesta JSON inválida de IA: faltan campos 'status' o 'mensaje_usuario'.");
    }
    if (parsedData.status === "EXACT_MATCH" || parsedData.status === "UNIT_CORRECTION_SUGGESTION") {
        if (!parsedData.match_details) throw new Error("Faltan 'match_details' para el status " + parsedData.status);
        // Further check required fields in match_details
        const md = parsedData.match_details;
        if (typeof md.item_original !== 'string' || typeof md.tienda !== 'string' || typeof md.marca !== 'string' || 
            typeof md.producto_base_corregido !== 'string' || typeof md.variante_corregida !== 'string' ||
            typeof md.sabor_extraido !== 'string' || typeof md.upc !== 'string') {
          throw new Error("Campos incompletos o con tipo incorrecto en 'match_details'.");
        }
    }
     if (parsedData.status === "VARIANT_SUGGESTION") {
        if (!parsedData.producto_base_identificado || !Array.isArray(parsedData.sugerencias_variantes_disponibles)) {
            throw new Error("Faltan 'producto_base_identificado' o 'sugerencias_variantes_disponibles' para VARIANT_SUGGESTION.");
        }
        if (parsedData.sugerencias_variantes_disponibles.length > 0) {
            const sug = parsedData.sugerencias_variantes_disponibles[0];
             if (typeof sug.item_original !== 'string' || typeof sug.tienda !== 'string' || typeof sug.marca !== 'string' || 
                typeof sug.producto_base_corregido !== 'string' || typeof sug.variante_corregida !== 'string' ||
                typeof sug.sabor_extraido !== 'string' || typeof sug.upc !== 'string') {
              throw new Error("Campos incompletos o con tipo incorrecto en 'sugerencias_variantes_disponibles'.");
            }
        }
    }

    return parsedData;

  } catch (error: any) {
    console.error("Error al interactuar con servicio de IA o al parsear la respuesta:", error);
    let userMessage = "Error al procesar la sugerencia con IA. Intenta de nuevo más tarde.";
    if (error.message && error.message.includes("API key not valid")) {
        userMessage = "Error de configuración: La clave API de IA no es válida. Por favor, verifica la configuración.";
    } else if (error instanceof SyntaxError) {
        userMessage = "Error al interpretar la respuesta de la IA. El formato JSON recibido es inválido.";
    } else if (error.message && error.message.includes("JSON inválida")) {
        userMessage = `Error: ${error.message}`;
    }
    
    return {
      status: "ERROR",
      mensaje_usuario: userMessage,
    };
  }
}; 