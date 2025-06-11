

export enum NavigationPath {
  Login = '/login',
  Dashboard = '/dashboard',
  Users = '/users',
  Scraping = '/scraping',
  ScrapingIA = '/scraping-ia',
  ScrapingReview = '/scraping/review', // New path for the review page
  ScrapingReviewComercio = '/scraping/review/:comercio', // New path with comercio parameter
  HistoryList = '/history',
  HistoryDetail = '/history/:id', // Example with param. :id will represent id_producto
  Products = '/products', // New path for products list
  ProductScrapingDetail = '/scraping/:comercio/:id_producto', // New path for product scraping detail
  Retailers = '/retailers',
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile: string; // e.g., "Administrador", "Usuario"
  isActive: boolean;
}

export interface ProductPrice {
  comercio: string; // Name of the retailer
  producto: string; // Name of the product
  precio: number | null;
  fechaHora: string; // Timestamp string
  originalComercio?: string; 
}

export interface MonthlyPricePoint {
  month: string; // e.g., "Ene", "Feb"
  price: number;
}

export interface PriceHistoryByRetailer {
  [retailerName: string]: MonthlyPricePoint[];
}

export interface PriceHistoryData {
  [productName: string]: PriceHistoryByRetailer;
}

export interface CurrentPricesData {
  [productName: string]: ProductPrice[];
}

export interface CatalogProduct {
  id: string; // Corresponds to id_producto in backend after creation
  tienda: string; // "walmart", "bodega", "soriana" - maps to nombre in 'tienda' table
  marca: string;
  item_original: string; 
  producto_base_sugerido: string; 
  variante_sugerida: string; 
  sabor_sugerido: string; 
  upc: string;
}


export interface ExtractedProductDetails {
  item_original: string;
  tienda: string; 
  marca: string;
  producto_base_corregido: string;
  variante_corregida: string;
  sabor_extraido: string; 
  upc: string;
}

export type SuggestionStatus = "EXACT_MATCH" | "VARIANT_SUGGESTION" | "UNIT_CORRECTION_SUGGESTION" | "NO_MATCH" | "ERROR";

export interface SmartSuggestionResponse {
  status: SuggestionStatus;
  match_details?: ExtractedProductDetails;
  producto_base_identificado?: string;
  sugerencias_variantes_disponibles?: ExtractedProductDetails[];
  mensaje_usuario: string;
}

// Payload for submitting new scraping data to our backend (via useDataSender)
export interface ScrapingDataPayload {
  // Fields matching user input or selections
  comercio: string; // Name of the retailer, e.g., "Walmart Super/Express"
  producto: string; // Full product name from selection, e.g., "Ades bebida de soya sabor natural 946 ml"
  variante: string; // e.g., "946ml"
  
  // Optional details, some might be derived or directly from user input in IA page
  urlComercio?: string;
  urlProducto?: string;
  marca?: string;       // Brand name, e.g., "Ades"
  categoria?: string;   // Category name, e.g., "Bebidas"
  sku?: string;
  upc?: string;
  sabor?: string;
  unidadMedida?: string; // e.g., "ml", "L", "kg", "gr"
  
  // Price information is crucial for historial_precio
  precio?: number;      // The scraped price
  moneda?: string;      // e.g., "MXN"
  etiqueta_promo?: string; // e.g., "Oferta", "Liquidación"
}


// Represents an entry in the scraping history list.
// This will be constructed by joining data from 'producto', 'tienda', 'categoria', 'marca', and 'historial_precio' tables.
export interface ScrapingHistoryEntry {
  id: string; // This will be id_historial_precio from backend
  id_producto: number; // Foreign key to 'producto' table
  comercio: string;    // tienda.nombre
  categoria: string;   // categoria.nombre
  producto: string;    // producto.nombre + other details like sabor/volumen
  upc: string | null;        // producto.upc
  sku: string | null;        // producto.sku
  precio: number;      // historial_precio.precio
  fechaHora: string;   // historial_precio.capturado_en (formatted)
}


// Corresponds to the 'tienda' table in the backend
export interface RetailerInfo {
  id: string; // Corresponds to id_tienda (is number in backend, string here for consistency if needed)
  name: string; // Corresponds to nombre
  url: string;  // Corresponds to url_base
  logoUrl?: string; 
  codigo_pais?: string; // Corresponds to codigo_pais
}

// Corresponds to the 'categoria' table
export interface CategoryInfo {
  id_categoria: number;
  nombre: string;
}

// Corresponds to the 'marca' table
export interface BrandInfo {
  id_marca: number;
  nombre: string;
}

// Corresponds to the 'producto' table from backend (enriched)
export interface BackendProduct {
  id_producto: number;
  id_tienda: number;
  id_categoria: number;
  id_marca: number;
  nombre: string;
  sabor?: string | null;
  volumen_ml?: number | null;
  upc?: string | null;
  sku?: string | null;
  url_producto?: string | null;
  creado_en: string;
  // Joined fields
  nombre_tienda: string;
  nombre_categoria: string;
  nombre_marca: string;
}

// Corresponds to 'historial_precio' table
export interface BackendPriceHistory {
  id_precio: number;
  id_producto: number;
  precio: number;
  moneda: string;
  etiqueta_promo?: string | null;
  capturado_en: string; // Timestamp string e.g. "YYYY-MM-DD HH:MM:SS"
}