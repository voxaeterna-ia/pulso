import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

interface KycValidateRequest {
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  numeroDocumento: string;
  frenteDniBase64: string;
  dorsoDniBase64: string;
  selfieBase64: string;
}

const REQUIRED_FIELDS: (keyof KycValidateRequest)[] = [
  "nombres",
  "apellidos",
  "fechaNacimiento",
  "numeroDocumento",
  "frenteDniBase64",
  "dorsoDniBase64",
  "selfieBase64",
];

interface DocumentExtraction {
  numero_frente: string | null;
  numero_dorso: string | null;
  nombres_documento: string | null;
  apellidos_documento: string | null;
  fecha_nacimiento_documento: string | null;
  parece_documento_identidad: boolean;
  rostro_detectado_en_selfie: boolean;
  usa_anteojos: boolean;
  usa_mascara: boolean;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function extractDataUrl(base64: string): { mediaType: string; data: string } | null {
  const match = base64.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/);
  if (!match) return null;
  return { mediaType: match[1], data: match[2] };
}

export async function POST(request: NextRequest) {
  let body: Partial<KycValidateRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !body[field]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios", missing },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Validación KYC no configurada en el servidor" },
      { status: 503 }
    );
  }

  const { nombres, apellidos, fechaNacimiento, numeroDocumento, frenteDniBase64, dorsoDniBase64, selfieBase64 } =
    body as KycValidateRequest;

  const frente = extractDataUrl(frenteDniBase64);
  const dorso = extractDataUrl(dorsoDniBase64);
  const selfie = extractDataUrl(selfieBase64);

  if (!frente || !dorso || !selfie) {
    return NextResponse.json(
      { error: "Las imágenes deben enviarse como data URL (image/jpeg, image/png o image/webp)" },
      { status: 400 }
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let extraction: DocumentExtraction;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Analizá las tres imágenes adjuntas: la primera es el frente de un documento de identidad, " +
                "la segunda es el dorso, y la tercera es una selfie de la persona. " +
                "Extraé únicamente lo que esté legible en las imágenes, sin inventar ni completar datos. " +
                "Respondé EXCLUSIVAMENTE con un objeto JSON (sin texto adicional, sin markdown) con esta forma exacta:\n" +
                "{\n" +
                '  "numero_frente": string|null,\n' +
                '  "numero_dorso": string|null,\n' +
                '  "nombres_documento": string|null,\n' +
                '  "apellidos_documento": string|null,\n' +
                '  "fecha_nacimiento_documento": string|null (formato yyyy-mm-dd si es posible),\n' +
                '  "parece_documento_identidad": boolean (false si frente/dorso no parecen un documento de identidad real),\n' +
                '  "rostro_detectado_en_selfie": boolean (true solo si hay un rostro humano real, claramente visible),\n' +
                '  "usa_anteojos": boolean (true si la persona de la selfie usa anteojos, incluidos los de sol),\n' +
                '  "usa_mascara": boolean (true si la persona de la selfie tiene el rostro cubierto por un barbijo, pasamontañas u otro elemento)\n' +
                "}",
            },
            { type: "image", source: { type: "base64", media_type: frente.mediaType as "image/jpeg" | "image/png" | "image/webp", data: frente.data } },
            { type: "image", source: { type: "base64", media_type: dorso.mediaType as "image/jpeg" | "image/png" | "image/webp", data: dorso.data } },
            { type: "image", source: { type: "base64", media_type: selfie.mediaType as "image/jpeg" | "image/png" | "image/webp", data: selfie.data } },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Respuesta sin contenido de texto");
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se pudo interpretar la respuesta del modelo");

    extraction = JSON.parse(jsonMatch[0]) as DocumentExtraction;
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la validación. Intentá de nuevo en unos minutos." },
      { status: 502 }
    );
  }

  const checks = {
    documentoCoincide: extraction.parece_documento_identidad
      ? (normalize(extraction.nombres_documento).includes(normalize(nombres)) ||
          normalize(nombres).includes(normalize(extraction.nombres_documento))) &&
        (normalize(extraction.apellidos_documento).includes(normalize(apellidos)) ||
          normalize(apellidos).includes(normalize(extraction.apellidos_documento))) &&
        normalize(extraction.fecha_nacimiento_documento) === normalize(fechaNacimiento)
        ? ("ok" as const)
        : ("no_coincide" as const)
      : ("no_detectado" as const),
    numeroCoincideFrenteDorso:
      !extraction.numero_frente || !extraction.numero_dorso
        ? ("no_legible" as const)
        : normalize(extraction.numero_frente) === normalize(extraction.numero_dorso) &&
            normalize(extraction.numero_frente) === normalize(numeroDocumento)
          ? ("ok" as const)
          : ("no_coincide" as const),
    rostroDetectado: extraction.rostro_detectado_en_selfie ? ("ok" as const) : ("no_detectado" as const),
  };

  const anteojosOMascaraDetectado = Boolean(extraction.usa_anteojos || extraction.usa_mascara);

  const aprobado =
    checks.documentoCoincide === "ok" &&
    checks.numeroCoincideFrenteDorso === "ok" &&
    checks.rostroDetectado === "ok" &&
    !anteojosOMascaraDetectado;

  let motivo: string | undefined;
  if (!aprobado) {
    const motivos: string[] = [];
    if (checks.documentoCoincide !== "ok") motivos.push("los datos personales no coinciden con el documento");
    if (checks.numeroCoincideFrenteDorso !== "ok") motivos.push("el número de documento no coincide entre frente, dorso y/o el ingresado");
    if (checks.rostroDetectado !== "ok") motivos.push("no se detectó un rostro humano válido en la selfie");
    if (anteojosOMascaraDetectado) motivos.push("la selfie muestra anteojos o el rostro cubierto");
    motivo = motivos.join("; ");
  }

  return NextResponse.json({
    documentoCoincide: checks.documentoCoincide,
    numeroCoincideFrenteDorso: checks.numeroCoincideFrenteDorso,
    rostroDetectado: checks.rostroDetectado,
    anteojosOMascaraDetectado,
    aprobado,
    motivo,
    validatedAt: new Date().toISOString(),
  });
}
