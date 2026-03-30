# 🌐 SmartInventory — Frontend Web (Next.js)

Este es el cliente web de SmartInventory, construido con **Next.js 15+**, **Tailwind CSS 4.0** y **Framer Motion**.

## 🚀 Desarrollo Local

1.  **Requisito**: Haber iniciado Supabase localmente en la raíz (`npx supabase start`).
2.  **Configuración**: Asegúrate de tener el archivo `.env.local` con las credenciales de tu instancia local.
3.  **Lanzamiento**:
    ```bash
    npm install
    npm run dev
    ```

## 📐 Arquitectura
Este frontend sigue un patrón **MVC**:
-   **Views**: Componentes en `src/views` (Presentación pura).
-   **Controllers**: Custom hooks en `src/controllers` (Lógica y Estado).
-   **Models**: Clases en `src/models` (Comunicación segura con Supabase).

## 🛠️ Comandos Útiles
-   `npm run lint`: Ejecuta el linter para asegurar calidad de código.
-   `npm run build`: Genera el bundle de producción.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
