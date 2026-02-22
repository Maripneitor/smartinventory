# 🧠 SmartInventory — Inventario Inteligente con IA

Bienvenido a **SmartInventory**, la aplicación definitiva para organizar tus pertenencias utilizando Inteligencia Artificial, códigos QR y búsqueda semántica. Olvídate de abrir cajas para saber qué hay dentro.

---

## ✨ Características Mágicas

- **🧠 Análisis con IA (Gemini/Groq)**: Sube una foto de un objeto y la IA rellenará automáticamente el nombre, categoría, descripción y etiquetas.
- **🛡️ Cerebro Híbrido**: Sistema de failover automático. Si Gemini falla, la app cambia a Groq (Llama 3.2 Vision) al instante.
- **🔍 Búsqueda Semántica**: Busca "algo para conectar la tele" y encontrará "Cables HDMI" aunque no uses las palabras exactas.
- **🖨️ Etiquetas QR Profesionales**: Genera y descarga etiquetas en PDF listas para imprimir y pegar en tus cajas.
- **🔗 Ecosistema de Dispositivos**: Vincula accesorios a sus equipos principales (ej: vincula un cargador a una laptop específica).

---

## 🚀 Guía de Inicio Rápido

Si acabas de descargar el proyecto, sigue estos pasos para ponerlo en marcha:

### 1. Requisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Una cuenta en [Supabase Cloud](https://supabase.com/) (Gratis)

### 2. Configura tus Secretos (.env)
Necesitas crear dos archivos clave para que la app conecte con tu cerebro y base de datos:

**A. En la raíz de `/apps/web/` crea el archivo `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-larga-que-empieza-con-ey...
```

**B. En la carpeta `/supabase/` crea el archivo `.env`:**
*(Esto es para las funciones de IA)*
```env
GEMINI_API_KEY=tu-api-key-de-google
GROQ_API_KEY=tu-api-key-de-groq
GEMINI_MODEL=gemini-2.0-flash
GROQ_VISION_MODEL=llama-3.2-11b-vision-preview
```

### 3. Prepara la Base de Datos
Ve al [SQL Editor de Supabase](https://supabase.com/dashboard/project/_/sql/new) y ejecuta en orden los archivos que están en la carpeta `/supabase/migrations/`:
1. `0001_init.sql` (Tablas base)
2. `0002_storage.sql` (Bucket para fotos)
3. `0003_semantic_search.sql` (Funciones de búsqueda)

### 4. Despliega la IA (Edge Functions)
Desde tu terminal en la raíz del proyecto:
```bash
# Inicia sesión
supabase login

# Vincula tu proyecto
supabase link --project-ref tu-referencia-de-proyecto

# Sube las funciones
supabase functions deploy analyze-item
supabase functions deploy embed-text
supabase functions deploy generate-embedding

# Sube las API Keys a la nube
supabase secrets set GEMINI_API_KEY=tu-key
supabase secrets set GROQ_API_KEY=tu-key
```

### 5. ¡Lanza la Aplicación!
```bash
cd apps/web
npm install
npm run dev
```
Abre **[http://localhost:3000](http://localhost:3000)** y ¡listo!

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15+, Tailwind CSS v4, Framer Motion.
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions).
- **IA**: Google Gemini (Visión & Embeddings) y Groq (Llama 3.2 Vision).
- **Herramientas**: jsPDF (Generación de etiquetas), Lucide (Iconos).

---

## 📦 Estructura del Proyecto
- `apps/web`: Aplicación principal de Next.js.
- `supabase/functions`: Las funciones de IA que corren en la nube.
- `supabase/migrations`: Los planos de tu base de datos.
- `docker`: Configuración para correr todo localmente sin internet.

---

Desarrollado con ❤️ para organizar el caos. ¡Disfruta tu inventario inteligente!
