# 🧠 SmartInventory — Inventario Inteligente con IA

Bienvenido a **SmartInventory**, la aplicación definitiva para organizar tus pertenencias utilizando Inteligencia Artificial, códigos QR y búsqueda semántica. Olvídate de abrir cajas para saber qué hay dentro.

---

## ✨ Características Mágicas

- **🧠 Análisis con IA (Gemini/Groq)**: Sube una foto de un objeto y la IA rellenará automáticamente el nombre, categoría, descripción y etiquetas.
- **⚡ Caché de IA**: Los resultados del análisis se guardan localmente para ahorrar API calls y dinero.
- **🖼️ Compresión Proactica**: Las fotos se comprimen en el cliente antes de subir, ahorrando datos y tiempo.
- **🛡️ Cerebro Híbrido**: Sistema de failover automático entre Gemini y Groq.
- **🔍 Búsqueda Semántica Optimizada**: Búsqueda vectorial ultra-rápida usando índices **HNSW** en Postgres.
- **🖨️ Etiquetas Profesionales (Zebra & Avery)**: Genera etiquetas individuales o hojas completas para etiquetas Avery (5160, 5163).
- **📱 PWA & Offline**: Instala la app y consulta tu inventario incluso sin conexión.
- **🔗 Ecosistema de Dispositivos**: Vincula accesorios a sus equipos principales (ej: "Laptops", "Consolas").

---

## 🚀 Guía de Inicio Rápido

### 1. Requisitos

- [Node.js](https://nodejs.org/) (versión 18+)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Cuenta en [Supabase Cloud](https://supabase.com/)

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
```

### 3. Base de Datos

Ejecuta las migraciones en `/supabase/migrations/` en orden correlativo (0001 a 0009).

### 4. Salud del Sistema

Puedes verificar que todo esté bien configurado con:

```bash
cd apps/web
node scripts/check-db.js
```

### 5. Lanzamiento

```bash
npm install
npm run dev
```

---

## 🛠️ Tecnologías

- **Frontend**: Next.js 15+, Tailwind CSS, Zustand, html5-qrcode.
- **Backend**: Supabase (Postgres + pgvector, Auth, Storage, Edge Functions).
- **IA**: Google Gemini 2.0 & Llama 3.2 via Groq.
- **PDF**: jsPDF para generación de etiquetas.

---

## 📦 Estructura

- `@/core`: Lógica de negocio consumible por toda la app.
- `supabase/functions`: Cerebros de IA en la nube.
- `supabase/migrations`: Planos de la base de datos.

Desarrollado con ❤️ para organizar el caos. ¡Disfruta tu inventario inteligente!
