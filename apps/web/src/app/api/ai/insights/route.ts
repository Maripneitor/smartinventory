import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { inventory } = await req.json();

        // Lógica de Auditoría Inteligente (Simulada para MVP)
        // En una versión real, esto enviaría el inventario a un modelo LLM (Gemini/Groq)
        // para encontrar patrones de redundancia y sugerir optimizaciones.
        
        const insights = [];

        // 1. Detectar cables redundantes
        const cables = inventory.filter((item: any) => 
            item.name.toLowerCase().includes('cable') || 
            item.tags?.some((t: string) => t.toLowerCase().includes('cable'))
        );

        if (cables.length >= 3) {
            insights.push({
                type: 'redundancy',
                title: 'Consolidación de Cables',
                description: `Se han detectado ${cables.length} cables dispersos en el inventario.`,
                items: cables.map((c: any) => c.id),
                recommendation: 'Agrupa todos los cables en un solo contenedor "Cables y Conectores" para reducir el ruido visual y facilitar la búsqueda.'
            });
        }

        // 2. Detectar herramientas fuera de lugar
        const tools = inventory.filter((item: any) => 
            item.category?.toLowerCase().includes('herramienta') ||
            item.name.toLowerCase().includes('destornillador') ||
            item.name.toLowerCase().includes('pinza')
        );

        if (tools.length > 0) {
            insights.push({
                type: 'optimization',
                title: 'Zonificación de Herramientas',
                description: 'Detectamos herramientas almacenadas en áreas generales.',
                items: tools.map((t: any) => t.id),
                recommendation: 'Mueve estos objetos a una ubicación de "Taller" o "Mantenimiento" para mantener las áreas de vida despejadas.'
            });
        }

        // 3. Sugerencia de etiquetado
        const unlabeled = inventory.filter((item: any) => !item.tags || item.tags.length === 0);
        if (unlabeled.length > 2) {
            insights.push({
                type: 'suggestion',
                title: 'Mejora de Descubribilidad',
                description: `${unlabeled.length} objetos no tienen etiquetas descriptivas.`,
                items: unlabeled.slice(0, 3).map((u: any) => u.id),
                recommendation: 'Usa el escáner de IA para generar etiquetas automáticas y mejorar la precisión de las búsquedas semánticas.'
            });
        }

        return NextResponse.json({ insights });
    } catch (error) {
        console.error("AI Insights API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
