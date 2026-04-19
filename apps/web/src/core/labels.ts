import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export interface AveryTemplate {
    name: string;
    rows: number;
    cols: number;
    labelWidth: number;
    labelHeight: number;
    marginTop: number;
    marginLeft: number;
    spacingX: number;
    spacingY: number;
}

export const AVERY_5160: AveryTemplate = {
    name: "Avery 5160 (Address Labels)",
    rows: 10,
    cols: 3,
    labelWidth: 66.675,
    labelHeight: 25.4,
    marginTop: 12.7,
    marginLeft: 4.76,
    spacingX: 3.175,
    spacingY: 0,
};

export const AVERY_5163: AveryTemplate = {
    name: "Avery 5163 (Shipping Labels)",
    rows: 5,
    cols: 2,
    labelWidth: 101.6,
    labelHeight: 50.8,
    marginTop: 12.7,
    marginLeft: 4.0,
    spacingX: 3.175,
    spacingY: 0,
};

/**
 * Genera un DataURL de QR de forma asíncrona
 */
async function generateQRDataURL(text: string): Promise<string> {
    try {
        return await QRCode.toDataURL(text, {
            margin: 1,
            width: 200,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        });
    } catch (err) {
        console.error("QR Generation Error:", err);
        return "";
    }
}

/**
 * Genera una hoja de etiquetas PDF usando una plantilla Avery.
 */
export async function generateAverySheet(params: {
    template: AveryTemplate;
    items: Array<{ id: string; label: string; qr_payload?: string }>;
    title?: string;
}) {
    const { template, items } = params;
    const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "letter",
    });

    let currentItem = 0;

    for (let r = 0; r < template.rows; r++) {
        for (let c = 0; c < template.cols; c++) {
            if (currentItem >= items.length) break;

            const x = template.marginLeft + c * (template.labelWidth + template.spacingX);
            const y = template.marginTop + r * (template.labelHeight + template.spacingY);

            const item = items[currentItem];

            // 1) Borde de referencia
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.1);
            doc.rect(x, y, template.labelWidth, template.labelHeight);

            // 2) Título de la caja
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(item.label, x + 5, y + 10);

            // 3) Subtítulo / ID
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text(`ID: ${item.id.slice(0, 13)}...`, x + 5, y + 15);

            // 4) QR Real
            const qrPayload = item.qr_payload || item.id;
            const qrDataUrl = await generateQRDataURL(qrPayload);
            if (qrDataUrl) {
                const qrSize = 12;
                doc.addImage(qrDataUrl, "PNG", x + template.labelWidth - qrSize - 5, y + 5, qrSize, qrSize);
            }
            
            doc.setFontSize(6);
            doc.text("Escanéa para ver contenido", x + 5, y + 20);
            
            currentItem++;
        }
    }

    doc.save(`inventario_labels_${Date.now()}.pdf`);
}

/**
 * Genera una etiqueta PDF inteligente con guías de corte y tamaños dinámicos.
 */
export async function generateSingleItemLabel(params: {
    item: { 
        name: string; 
        category: string | null; 
        serial_number: string | null;
        id?: string;
        qr_payload?: string;
    };
    size?: "small" | "medium";
}) {
    const { item, size = "medium" } = params;
    
    // Dimensiones en mm [Ancho, Alto]
    const dims: Record<string, [number, number]> = {
        small: [50, 30],
        medium: [80, 50]
    };
    
    const [width, height] = dims[size];
    
    const doc = new jsPDF({
        orientation: "l",
        unit: "mm",
        format: [width, height],
    });

    // 1. Dibujar Guías de Recorte
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([1, 1], 0);
    doc.setLineWidth(0.1);
    doc.rect(0.5, 0.5, width - 1, height - 1);
    doc.setLineDashPattern([], 0); 

    // 2. Borde de Contenido
    doc.setDrawColor(0, 95, 175);
    doc.setLineWidth(size === "small" ? 0.5 : 0.8);
    doc.rect(2, 2, width - 4, height - 4);

    // 3. Fuente Dinámica
    const maxChars = size === "small" ? 20 : 35;
    const baseFontSize = size === "small" ? 10 : 14;
    const nameLength = item.name.length;
    const fontSize = nameLength > maxChars 
        ? Math.max(size === "small" ? 6 : 8, baseFontSize * (maxChars / nameLength))
        : baseFontSize;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "bold");
    
    const textWidth = doc.getTextWidth(item.name);
    const xPos = nameLength > maxChars ? 4 : Math.max(4, (width - textWidth) / 2 - 10);
    doc.text(item.name.slice(0, 60), xPos, size === "small" ? 8 : 12);

    // 4. Categoría y Serial
    const categoryY = size === "small" ? 14 : 22;
    const serialY = size === "small" ? 22 : 38;

    doc.setFontSize(size === "small" ? 7 : 9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("CAT:", 5, categoryY);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(item.category || "GENERAL", 14, categoryY);

    doc.setFontSize(size === "small" ? 7 : 9);
    doc.setTextColor(120, 120, 120);
    doc.text("S/N:", 5, serialY);
    
    doc.setTextColor(0, 95, 175);
    doc.setFontSize(size === "small" ? 9 : 12);
    doc.text(item.serial_number || "PENDING", 14, serialY);

    // 5. QR Real
    const qrPayload = item.qr_payload || item.id || item.serial_number || "NO_PAYLOAD";
    const qrDataUrl = await generateQRDataURL(qrPayload);
    
    if (qrDataUrl) {
        const qrSize = size === "small" ? 12 : 20;
        const qrX = width - qrSize - 4;
        const qrY = height - qrSize - 4;
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    }

    // Branding
    doc.setFontSize(5);
    doc.setTextColor(180, 180, 180);
    doc.text("SMARTINVENTORY AI", width - 28, 6);

    doc.save(`etiqueta_${item.serial_number || 'item'}.pdf`);
}
