import { jsPDF } from "jspdf";

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
 * Genera una hoja de etiquetas PDF usando una plantilla Avery.
 */
export async function generateAverySheet(params: {
    template: AveryTemplate;
    items: Array<{ id: string; label: string }>;
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

            // 1) Borde (opcional, ayuda al corte si no es Avery pre-cortado)
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

            // 4) Espacio para el QR (Se asume que la URL es configurable)
            // Nota: Podríamos usar una librería de QR en JS para renderizar la imagen base64 aquí.
            doc.setFontSize(6);
            doc.text("Escanéa para ver contenido", x + 5, y + 20);
            
            currentItem++;
        }
    }

    doc.save(`inventario_labels_${Date.now()}.pdf`);
}
