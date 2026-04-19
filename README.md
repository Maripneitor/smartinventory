# 🧠 SmartInventory — Ecosistema de Inventario Inteligente

**SmartInventory** es una plataforma de gestión logística doméstica de vanguardia impulsada por Inteligencia Artificial. Diseñada para eliminar el caos en el almacenamiento físico mediante visión por computadora, búsqueda semántica y un flujo de usuario ultra-fluido.

---

## 🚀 Guía de Instalación Rápida

Sigue estos pasos para poner en marcha tu entorno de desarrollo local:

### 1. Requisitos Previos
*   **Node.js v18+** y **npm**.
*   **Docker Desktop** (para el stack de Supabase local).
*   **Git**.

### 2. Configuración
```bash
# Clonar repositorio
git clone https://github.com/Maripneitor/smartinventory.git
cd smartinventory

# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env
# Edita .env y añade tu GEMINI_API_KEY y GROQ_API_KEY
```

### 3. Iniciar Backend (Supabase Self-Host)
El proyecto utiliza una infraestructura completa vía Docker:
```bash
docker compose -f docker/docker-compose.yml up -d
```
*   **Postgres**: `localhost:5432`
*   **Supabase Studio**: `localhost:3000`
*   **API Gateway**: `localhost:8000`

### 4. Lanzar Frontend
```bash
cd apps/web
npm run dev
```
Accede en: [http://localhost:3001](http://localhost:3001)

---

## 🗺️ Mapa de Arquitectura

### Vistas Principales
*   **Dashboard (`/`)**: Resumen, estadísticas y panel de préstamos familiares activos.
*   **Scanner Inteligente (`/scan`)**: Interceptor de QRs para X-Ray de cajas y Devolución Mágica en 1 toque.
*   **Ruta de Recolección (`/picking`)**: Generación de trayectorias óptimas para recolección de múltiples objetos.
*   **Búsqueda Mágica (`/search`)**: Motor reactivo con soporte semántico (pgvector).
*   **Gestión de Contenedores (`/containers`)**: Organización jerárquica de cajas y ubicaciones.

### Core Stack
*   **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion, Zustand, Sonner.
*   **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions).
*   **IA**: Google Gemini 2.0 (Vision) & Llama 3.2 (Groq Fallback).
*   **Persistencia Local**: Dexie.js (Sincronización Offline).

---

## 📜 Normativa de IDs y Nomenclatura

SmartInventory utiliza un sistema de identificación jerárquico y legible para humanos:

### Estructura del Número de Serie (S/N)
`[CAT]-[AÑO]-[ID_CORRELATIVO]`
*   **CAT**: Código de categoría (Ej: `ELEC` para Electrónica, `HERR` para Herramientas).
*   **AÑO**: Últimos dos dígitos del año actual.
*   **ID**: Hash alfanumérico corto anti-colisión.

Ejemplo: `ELEC-26-X8F2`

---

## 🏗️ Estabilidad y Calidad
*   **Race Condition Prevention**: Buscador global con `AbortController`.
*   **Strict Typing**: Eliminación de `any` en servicios core y respuestas de IA.
*   **Bento UI**: Diseño consistente basado en Glassmorphism y micro-interacciones.

---
*Desarrollado con ❤️ por el equipo de SmartInventory - 2026*
