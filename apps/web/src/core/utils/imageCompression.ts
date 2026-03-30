/**
 * Comprime una imagen en formato Base64 (Data URL) para optimizar 
 * el envío a la API de IA.
 * 
 * @param base64Str - La imagen original capturada por la cámara.
 * @param maxWidth - Ancho máximo deseado (800px es ideal para Gemini/Groq).
 * @param quality - Calidad de compresión JPEG (0.0 a 1.0).
 * @returns Promesa con el nuevo string Base64 comprimido.
 */
export const compressImage = (
  base64Str: string,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calcular las nuevas dimensiones manteniendo el ratio de aspecto
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      // Crear un canvas en memoria
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("No se pudo obtener el contexto del canvas"));
        return;
      }

      // Dibujar la imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Exportar como JPEG comprimido
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = (error) => {
      reject(new Error(`Error al cargar la imagen para compresión: ${error}`));
    };

    img.src = base64Str;
  });
};
