# Price Tracker Scraper

Aplicación web para rastrear precios de productos de diferentes comercios, con capacidades de scraping y sugerencias de productos potenciadas por IA.

## Prerrequisitos

- Node.js
- Base de datos local configurada en puerto 8080

## Ejecutar Localmente

1. Instalar dependencias:
   `npm install`
2. Configurar la variable `AI_API_KEY` en [.env.local](.env.local) con tu clave API de IA (opcional, para sugerencias inteligentes)
3. Asegurar que tu base de datos local esté ejecutándose en `http://localhost:8080`
4. Ejecutar la aplicación:
   `npm run dev`

## Configuración de Base de Datos

La aplicación espera una API REST corriendo en `http://localhost:8080/api` con los siguientes endpoints:
- `/tiendas` - Gestión de comercios
- `/productos` - Gestión de productos
- `/historial-precios` - Historial de precios
- `/scraping` - Servicios de scraping

## Configuración de IA (Opcional)

Para habilitar las sugerencias de productos con IA, configura tu proveedor de IA preferido en `services/aiService.ts` y establece la variable `AI_API_KEY` en tu archivo de entorno.
