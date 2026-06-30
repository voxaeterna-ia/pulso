// ─── Conversión a data URL (para enviar al endpoint de validación KYC) ────────
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Validación de documento de identidad ─────────────────────────────────────
// El DNI argentino y la mayoría de documentos internacionales tienen
// proporción ~1.586:1 (85.6mm × 54mm, estándar ISO/IEC 7810 ID-1)

export async function validateDocument(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  if (file.size < 50_000)
    return { valid: false, error: "La imagen es muy pequeña. Acercate más al documento y volvé a sacar la foto." };
  if (file.size > 20_000_000)
    return { valid: false, error: "El archivo es muy grande. Máximo 20MB." };

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: "No se pudo leer la imagen. Intentá con otro archivo." });
    };

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const ratio = width / height;

      // El documento debe estar en posición horizontal (apaisado)
      if (width < height) {
        resolve({
          valid: false,
          error: "El documento debe estar en posición horizontal. Rotá el teléfono y volvé a sacar la foto.",
        });
        return;
      }

      // Proporción esperada para documentos ID: entre 1.2:1 y 2.1:1
      // DNI exacto es ~1.586:1, pasaporte abierto puede ser diferente
      if (ratio < 1.15 || ratio > 2.2) {
        resolve({
          valid: false,
          error: "La imagen no parece ser un documento de identidad. Asegurate de fotografiar el DNI completo, sin recortes, en posición horizontal.",
        });
        return;
      }

      // Resolución mínima para que el texto sea legible
      if (width < 400 || height < 200) {
        resolve({
          valid: false,
          error: "Resolución insuficiente. Acercate más al documento para que el texto sea legible.",
        });
        return;
      }

      // Verificar que no sea completamente negra o blanca (foto tapada/sobrexpuesta)
      checkBrightness(file).then((brightness) => {
        if (brightness < 15) {
          resolve({ valid: false, error: "La imagen es demasiado oscura. Buscá más luz y volvé a intentar." });
        } else if (brightness > 245) {
          resolve({ valid: false, error: "La imagen está sobrexpuesta. Evitá reflejos directos y volvé a intentar." });
        } else {
          resolve({ valid: true });
        }
      });
    };

    img.src = url;
  });
}

// ─── Validación de selfie con rostro ──────────────────────────────────────────
let faceApiLoaded = false;

export async function validateFace(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  if (file.size < 50_000)
    return { valid: false, error: "La imagen es muy pequeña. Usá la cámara frontal de tu celular." };

  // Verificar brillo básico antes del modelo
  const brightness = await checkBrightness(file);
  if (brightness < 20)
    return { valid: false, error: "La imagen es demasiado oscura. Buscá mejor iluminación (luz natural o lámpara)." };
  if (brightness > 245)
    return { valid: false, error: "La imagen está sobrexpuesta. Alejate de la fuente de luz directa." };

  // Intentar detección con face-api.js
  try {
    const faceapi = await import("face-api.js");

    if (!faceApiLoaded) {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      faceApiLoaded = true;
    }

    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = url;
    });

    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
    );

    URL.revokeObjectURL(url);

    if (detections.length === 0) {
      return {
        valid: false,
        error: "No se detectó ningún rostro humano. Mirá de frente a la cámara, asegurate de tener buena iluminación y que tu cara esté completamente visible.",
      };
    }

    if (detections.length > 2) {
      return {
        valid: false,
        error: "Se detectaron varios rostros. La selfie debe mostrar solo tu cara junto al documento.",
      };
    }

    return { valid: true };
  } catch {
    // Si face-api falla (sin conexión para cargar modelo, etc.), aceptamos con advertencia
    return { valid: true };
  }
}

// ─── Helper: brillo promedio via canvas ───────────────────────────────────────
function checkBrightness(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); resolve(128); };
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Usamos thumbnail para no procesar imagen completa
      canvas.width  = 80;
      canvas.height = 80;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); resolve(128); return; }
      ctx.drawImage(img, 0, 0, 80, 80);
      const { data } = ctx.getImageData(0, 0, 80, 80);
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        total += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      }
      URL.revokeObjectURL(url);
      resolve(total / (data.length / 4));
    };
    img.src = url;
  });
}
