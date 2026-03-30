/**
 * parseAIResponse — Extractor de JSON a prueba de balas.
 *
 * Problema: Los LLMs (Gemini, Llama, etc.) envuelven su respuesta en bloques
 * de markdown: ```json ... ```. Un simple JSON.parse() falla con ese texto crudo.
 *
 * Solución: Extraemos SOLO la estructura JSON ({...} o [...]) ignorando todo
 * lo demás, independientemente de cómo el modelo formatee su respuesta.
 */
export function parseAIResponse<T = unknown>(textResponse: string): T {
  if (!textResponse || typeof textResponse !== 'string') {
    throw new Error('[parseAIResponse] La respuesta de la IA está vacía o no es un string.');
  }

  // Intento 1: JSON directo (sin markdown) — el camino feliz.
  try {
    return JSON.parse(textResponse) as T;
  } catch {
    // No era JSON puro, continuamos limpiando.
  }

  // Intento 2: Extraer el bloque dentro de ```json ... ``` o ``` ... ```
  const fenceMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      // El bloque de backticks no era JSON válido, seguimos.
    }
  }

  // Intento 3 (más robusto): Extraer directamente la primera { } o [ ] válida.
  // Esto maneja casos donde hay texto introductorio antes del JSON.
  const jsonMatch = textResponse.match(/[\{\[][\s\S]*[\}\]]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      // Aún falla — puede ser un JSON parcial o con comentarios.
    }
  }

  // Sin éxito: logeamos y lanzamos un error descriptivo.
  console.error('[parseAIResponse] No se pudo parsear la respuesta:', textResponse.slice(0, 500));
  throw new Error(
    'La IA devolvió un formato ilegible. No se encontró una estructura JSON válida en la respuesta.'
  );
}
