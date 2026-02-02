export function formatSpecialty(specialty: string | null | undefined): string {
  if (!specialty) return "N/A";

  const map: Record<string, string> = {
    clinica_medica: "Clínica Médica",
    cirurgia_geral: "Cirurgia Geral",
    cardiologia: "Cardiologia",
    dermatologia: "Dermatologia",
    endocrinologia: "Endocrinologia",
    gastroenterologia: "Gastroenterologia",
    ginecologia: "Ginecologia",
    neurologia: "Neurologia",
    oftalmologia: "Oftalmologia",
    ortopedia: "Ortopedia",
    otorrinolaringologia: "Otorrinolaringologia",
    pediatria: "Pediatria",
    psiquiatria: "Psiquiatria",
    urologia: "Urologia",
    nutricao: "Nutrição",
    fisioterapia: "Fisioterapia",
    fonoaudiologia: "Fonoaudiologia",
    psicologia: "Psicologia",
  };

  const normalized = specialty.toLowerCase().trim();

  if (map[normalized]) {
    return map[normalized];
  }

  // Fallback: title case and replace underscores
  return normalized
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
