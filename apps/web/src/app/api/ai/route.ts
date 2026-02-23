import { NextResponse } from "next/server";

export async function POST(req: Request) {
    // Solo existe en modo mock — en prod/real la IA llama a Edge Functions directamente
    if (process.env.AI_MODE !== 'mock') {
        return NextResponse.json({ error: "AI mock no está activo. Usa AI_MODE=mock para habilitarlo." }, { status: 404 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const functionName = searchParams.get('function');
        const body = await req.json();

        if (functionName === 'analyze-item') {
            const fileName = (body.photo_path || "").toLowerCase();

            let suggestion = {
                nombre_corto: "Objeto Detectado",
                categoria: "Otros",
                descripcion: "Análisis inteligente completado.",
                color: "N/A",
                tags: ["hogar", "inventario"],
                posible_dispositivo: "Este objeto no parece requerir vinculación."
            };

            if (fileName.includes('camara') || fileName.includes('camera') || fileName.includes('lens')) {
                suggestion = {
                    nombre_corto: "Cámara Digital",
                    categoria: "Fotografía",
                    descripcion: "Cámara de alto rendimiento detectada.",
                    color: "Negro",
                    tags: ["foto", "equipo", "lente"],
                    posible_dispositivo: "Es un equipo principal."
                };
            } else if (fileName.includes('cable') || fileName.includes('usb') || fileName.includes('hdmi')) {
                suggestion = {
                    nombre_corto: "Cable de Conexión",
                    categoria: "Accesorios",
                    descripcion: "Accesorio de conectividad detectado.",
                    color: "Negro",
                    tags: ["cable", "conector", "usb"],
                    posible_dispositivo: "Podría pertenecer a un PC o monitor."
                };
            }

            return NextResponse.json(suggestion);
        }

        if (functionName === 'generate-embedding' || functionName === 'embed-text') {
            const mockVector = new Array(768).fill(0).map(() => Math.random());
            return NextResponse.json({
                embedding: mockVector,
                success: true,
                dimensions: 768
            });
        }

        return NextResponse.json({ error: "Función no reconocida" }, { status: 400 });
    } catch (e: any) {
        console.error("AI API Error:", e);
        return NextResponse.json({ error: e.message || "Error en IA local" }, { status: 500 });
    }
}
