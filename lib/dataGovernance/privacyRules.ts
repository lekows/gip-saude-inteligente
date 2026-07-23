const SYNTHETIC_CNS_PATTERN = /^SIM-CNS-\d{6}$/;

const IDENTIFIABLE_PATIENT_COLUMNS = new Set([
  "cns",
  "cpf",
  "patient_id",
  "patient_name",
  "nome_paciente",
  "data_nascimento",
  "birth_date",
  "endereco",
  "address",
  "logradouro",
  "numero_residencia",
  "house_number",
  "latitude_residencial",
  "longitude_residencial"
]);

export function createSyntheticCnsIdentifier(sequence: number) {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999999) {
    throw new RangeError("A sequencia sintetica deve estar entre 1 e 999999.");
  }

  return `SIM-CNS-${String(sequence).padStart(6, "0")}`;
}

export function isSyntheticCnsIdentifier(value: string) {
  return SYNTHETIC_CNS_PATTERN.test(value.trim().toUpperCase());
}

export function findIdentifiablePatientColumns(headers: string[]) {
  return headers
    .map(normalizeColumnName)
    .filter((header, index, normalized) => {
      return IDENTIFIABLE_PATIENT_COLUMNS.has(header) && normalized.indexOf(header) === index;
    });
}

function normalizeColumnName(value: string) {
  return value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}
