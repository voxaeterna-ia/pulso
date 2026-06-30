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

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // La extracción y comparación de datos del documento se implementa en la
  // siguiente etapa (Etapa 3: validación por IA). Por ahora este endpoint
  // solo confirma que la infraestructura (SDK + credenciales) está operativa.
  void anthropic;

  return NextResponse.json(
    { status: "pendiente_implementacion" },
    { status: 501 }
  );
}
