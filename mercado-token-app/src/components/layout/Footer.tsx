export default function Footer() {
  return (
    <footer className="border-t mt-16 py-8 px-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0A0A0A" }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-xs leading-relaxed" style={{ color: "#52525B" }}>
          Mercado Token se encuentra en etapa de desarrollo conceptual y tecnológico.
          La información presentada no constituye oferta pública de valores, asesoramiento financiero
          ni invitación directa a invertir. Toda futura operación estará sujeta al marco legal y
          regulatorio aplicable en cada jurisdicción.
        </p>
        <p className="text-center text-xs mt-3" style={{ color: "#3F3F46" }}>
          © {new Date().getFullYear()} Mercado Token · Versión MVP
        </p>
      </div>
    </footer>
  );
}
