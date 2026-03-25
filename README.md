# 🧠 SmartInventory — Inventario Inteligente de Vanguardia

**SmartInventory** es un ecosistema de gestión de inventarios impulsado por Inteligencia Artificial diseñado para eliminar el caos en el almacenamiento físico. Utiliza visión por computadora (Gemini/Groq) y búsqueda semántica (pgvector) para que organizar y encontrar objetos sea tan fácil como hablar con un asistente.

---

## 📋 Requisitos del Sistema

<<<<<<< HEAD
### 1. Requisitos Funcionales (Lo que la app HACE)

- **🧠 Análisis de Objetos con IA**: Identificación automática de nombres, categorías, etiquetas y descripciones a partir de una sola foto.
- **🔌 Detección de Accesorios (Nuevo)**: La IA identifica cables, transformadores, bases y manuales, indicando si están incluidos o faltantes en el kit.
- **⚙️ Especificaciones Técnicas**: Extracción y almacenamiento de detalles como voltajes (12V 2A), modelos de WiFi, marcas y estado físico.
- **🔍 Búsqueda Híbrida/Semántica**: Encuentra objetos no solo por nombre, sino por función o descripción (ej: "algo para conectar la tele").
- **📦 Jerarquía de Almacenamiento**: Organización multinivel (Ubicación -> Estante -> Caja -> Ítem).
- **🖨️ Generación de QR**: Creación de códigos QR únicos para cajas y objetos para acceso instantáneo vía escaneo.
- **📊 Dashboard de Estadísticas**: Visualización en tiempo real del total de ítems, cajas ocupadas y flujo de inventario reciente.
- **📥 Importación/Exportación**: Respaldo de datos en formato CSV para análisis externo.

### 2. Requisitos No Funcionales (CÓMO lo hace)

- **🎨 Experiencia de Usuario Premium**: Interfaz moderna con estética dark-mode, glassmorphism y micro-animaciones fluidas (Framer Motion).
- **🚀 Rendimiento Optimizado**: Compresión proactiva de imágenes en el cliente (max 800px) para subidas instantáneas y ahorro de ancho de banda.
- **🛡️ Seguridad por Diseño**: Arquitectura desacoplada donde las API Keys de IA viven exclusivamente en el servidor (Supabase Edge Functions).
- **🔄 Resiliencia de IA (Failover)**: Sistema en cascada que alterna entre Gemini 2.0 y Llama 3.2 (Groq) ante fallos de cuota o red.
- **💾 Caché de Inteligencia**: Almacenamiento local de análisis previos para evitar llamadas redundantes a la IA.
- **📱 Responsive & PWA**: Diseño "Mobile-First" que funciona como app nativa en dispositivos iOS/Android.
- **🏗️ Arquitectura MVC**: Código tipado estrictamente en TypeScript con separación clara entre Modelos de Dominio, Controladores (Hooks) y Vistas.

---

## 🖼️ Vistas del Sistema

### 1. Dashboard (Panel Principal)

El centro de mando. Muestra contadores clave, accesos rápidos al scanner y una lista de los últimos objetos indexados con un diseño limpio y profesional.

### 2. Robust AI Scanner

Cámara integrada que guía al usuario. Incluye detección de errores de red, feedback visual de análisis y un "cerebro trabajando" animado mientras procesa la imagen.

### 3. Data Review & Edit (Revisión de Datos)

Formulario avanzado donde el usuario confirma lo que la IA detectó.

- **Panel de Accesorios**: Lista dinámica con iconos ✅/❌ para cables y bases.
- **Panel de Specs**: Campo para detalles técnicos y estado (Buen estado, Desgastado, etc.).
- **Selector Inteligente**: Sugiere automáticamente en qué caja y ubicación guardar el objeto según su categoría.

### 4. Búsqueda Semántica (Magic Search)

Interfaz minimalista que permite alternar entre búsqueda "IA Híbrida" (conceptos) y "Búsqueda Clásica" (palabras exactas).

### 5. Mapa de Ubicaciones

Vista jerárquica para gestionar habitaciones y estantes. Permite ver qué cajas están en cada lugar de un vistazo.

### 6. Configuración & Herramientas

Gestión de perfil, estado de sincronización y utilidades como el generador de etiquetas masivo.

---

## 🛠️ Stack Tecnológico

- **Core**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS + Framer Motion (Animaciones) + Lucide (Iconos).
- **Backend**: Supabase (Postgres, Auth, Storage).
- **Cerebro**: Gemini 2.0 Flash + Groq (Llama 3.2).
- **Base de Datos**: PGVector + Índices HNSW para búsqueda vectorial.
=======
- **🧠 Análisis con IA Multi-Motor (Gemini/Groq/Cloud Vision)**: Sube una foto de un objeto y la IA rellenará automáticamente el nombre, categoría, descripción y etiquetas.
- **⚡ Caché de IA Inteligente**: Los resultados del análisis se guardan localmente para ahorrar API calls y optimizar el rendimiento.
- **🖼️ Compresión Proactiva**: Las fotos se comprimen en el cliente antes de subir, ahorrando datos y tiempo.
- **🛡️ Cerebro Híbrido & Failover**: Sistema de redundancia automática entre Gemini, Groq y Google Cloud Vision.
- **🔍 Búsqueda Semántica Vectorial**: Búsqueda ultra-rápida usando índices **HNSW** en Postgres para encontrar objetos por concepto, no solo por nombre.
- **📍 Gestión de Ubicaciones Jerárquica**: Organiza tus pertenencias en una estructura lógica de ubicaciones y sub-ubicaciones con un picker intuitivo.
- **🖨️ Etiquetas Profesionales**: Genera etiquetas individuales o hojas completas para etiquetas Avery (5160, 5163) listas para imprimir.
- **📱 PWA & Offline Readiness**: Instala la app y consulta tu inventario incluso sin conexión.
>>>>>>> 4c4af39 (Actualización: Cloud Vision AI, gestión de ubicaciones, router de funciones local y README)

---

## 🚀 Guía de Inicio Rápido

<<<<<<< HEAD
### Comandos de Desarrollo
=======
### 1. Requisitos

- [Node.js](https://nodejs.org/) (versión 18+)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para ejecución local)

### 2. Configuración (.env)

**Apps/Web/.env.local:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

**Supabase/.env:**

```env
GEMINI_API_KEY=tu-api-key
GROQ_API_KEY=tu-api-key
CLOUD_VISION_API_KEY=tu-api-key # Opcional: Para el motor de Cloud Vision
```

### 3. Base de Datos & Local Dev

Si usas Supabase Local:

```bash
supabase start
```

O si prefieres el despliegue manual, ejecuta las migraciones en `/supabase/migrations/` en orden correlativo.

### 4. Salud del Sistema

Puedes verificar que todo esté bien configurado con:
>>>>>>> 4c4af39 (Actualización: Cloud Vision AI, gestión de ubicaciones, router de funciones local y README)

```bash
# Iniciar servicios de Supabase (Docker)
npx supabase start

# Aplicar migraciones de base de datos
npx supabase db reset

# Lanzar el frontend
npm run dev
```

<<<<<<< HEAD
Desarrollado con precisión técnica para transformar el almacenamiento tradicional en un sistema inteligente. 🚀
=======
---

## 🛠️ Tecnologías

- **Frontend**: Next.js 15+, Tailwind CSS, Zustand, html5-qrcode.
- **Backend**: Supabase (Postgres + pgvector, Auth, Storage, Edge Functions).
- **IA**: Google Gemini 2.0, Llama 3.2 via Groq & Google Cloud Vision.
- **Salud del Sistema**: Docker & Healthchecks optimizados para estabilidad local.
- **PDF**: jsPDF para generación de etiquetas.

---

## 📦 Estructura del Proyecto

- `@/core`: Lógica de negocio consumible por toda la app.
- `apps/web`: Aplicación principal Next.js.
- `supabase/functions`: Cerebros de IA en la nube (Edge Functions).
- `supabase/migrations`: Planos de la base de datos y esquemas vectoriales.

Desarrollado con ❤️ para organizar el caos. ¡Disfruta tu inventario inteligente!
>>>>>>> 4c4af39 (Actualización: Cloud Vision AI, gestión de ubicaciones, router de funciones local y README)
