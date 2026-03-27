# 🛠️ Guía de Inicio Rápido - SmartInventory

Esta guía explica cómo poner en marcha el proyecto completo (Frontend, Backend y Servicios de IA) utilizando **Docker**.

---

## 📋 1. Requisitos Previos

*   **Docker Desktop** (Mac, Windows o Linux).
*   **Git**.

---

## ⚙️ 2. Configuración Inicial

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/Maripneitor/smartinventory.git
    cd smartinventory
    ```

2.  **Configurar Variables de Entorno**:
    Copia el archivo de ejemplo y rellena las claves de IA:
    ```bash
    cp .env.example .env
    ```
    Edita el archivo `.env` y asegúrate de tener:
    *   `GEMINI_API_KEY`: Tu clave de Google AI.
    *   `GROQ_API_KEY`: Tu clave de Groq.
    *   `POSTGRES_PASSWORD`: Una contraseña segura.

---

## 🚀 3. Ejecución con Docker

El proyecto está orquestado para levantar 15 servicios automáticamente (Base de datos, Autenticación, Studio, Storage, Next.js, etc.).

Ejecuta el siguiente comando en la raíz:
```bash
docker compose -f docker/docker-compose.yml up -d
```

### 🔍 ¿Qué está pasando?
*   **Postgres + pgvector**: Se levanta la base de datos con soporte para búsqueda semántica.
*   **Migration Runner**: Aplica automáticamente todos los archivos en `/supabase/migrations/` (incluyendo el sistema de vectores e IA).
*   **Edge Functions**: Se levanta el runtime de Deno para procesar las imágenes con Gemini y Groq.
*   **Next.js App**: La aplicación web se compila y se sirve.

---

## 🌐 4. URLs del Ecosistema

Una vez que los contenedores estén en verde, puedes acceder a:

*   **Aplicación Web**: [http://localhost:3001](http://localhost:3001)
*   **Supabase Studio (Dashboard)**: [http://localhost:3000](http://localhost:3000)
    *   *Aquí puedes ver las tablas, logs y buckets de storage.*
*   **API Gateway (Kong)**: [http://localhost:8000](http://localhost:8000)
*   **Inbucket (Capturador de Emails)**: [http://localhost:9000](http://localhost:9000)
    *   *Usa esto para ver los Magic Links de login o confirmaciones de cuenta.*

---

## 🧪 5. Verificación de IA

Para comprobar que el reconocimiento de objetos funciona:
1.  Ve a `http://localhost:3001/inventory`.
2.  Haz clic en **"Nuevo Item"**.
3.  Activa la cámara y toma una foto de un objeto (ej. tus audífonos).
4.  Si los logs de Docker muestran actividad en el servicio `functions`, ¡todo está correcto!

---

## 🛑 6. Comandos Útiles

*   **Ver logs de IA**: `docker compose -f docker/docker-compose.yml logs -f functions`
*   **Detener todo**: `docker compose -f docker/docker-compose.yml down`
*   **Reiniciar un servicio específico**: `docker compose -f docker/docker-compose.yml restart web`

---

## ⚠️ Solución de Problemas

*   **Error de pgvector**: Si la búsqueda semántica no funciona, asegúrate de que el contenedor de `db` use la imagen `supabase/postgres:15.8.1.060` (ya configurada por defecto).
*   **Puertos ocupados**: Si el puerto 8000 o 3000 están en uso, deberás cerrarlos o cambiarlos en el `docker-compose.yml`.

---
*SmartInventory - Potenciado por IA Generativa y Búsqueda Vectorial.*
