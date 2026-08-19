import { z } from "zod";

export const importEntitySchema = z.enum(["machine_identities", "credentials", "resources", "access_relationships"]);
const forbiddenHeaders = new Set(["secret", "secret_value", "password", "token", "api_key", "private_key", "credential_value"]);

export function parseCsv(text: string) {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) { const character = text[index]; const next = text[index + 1]; if (character === '"' && quoted && next === '"') { cell += '"'; index += 1; } else if (character === '"') quoted = !quoted; else if (character === "," && !quoted) { row.push(cell.trim()); cell = ""; } else if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && next === "\n") index += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; } else cell += character; }
  if (quoted) throw new Error("CSV contains an unclosed quote."); if (cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); }
  if (rows.length < 2) throw new Error("CSV must include a header and at least one row.");
  const headers = rows[0].map((header) => header.trim().toLowerCase()); if (headers.some((header) => forbiddenHeaders.has(header))) throw new Error("Credential secret fields are not accepted."); if (headers.some((header) => !header)) throw new Error("CSV contains an empty header.");
  return rows.slice(1).map((values, rowIndex) => { const record: Record<string, string> = {}; headers.forEach((header, index) => { record[header] = values[index] ?? ""; }); return { row: rowIndex + 2, values: record }; });
}

export const csvTemplates: Record<z.infer<typeof importEntitySchema>, string> = {
  machine_identities: "name,identity_type,provider,external_id,environment,owner_name,owner_email,privilege_level,status,description",
  credentials: "machine_identity_id,credential_type,label,status,last_rotated_at,expires_at,fingerprint_reference",
  resources: "name,resource_type,provider,external_id,environment,sensitivity,description",
  access_relationships: "machine_identity_id,resource_id,access_level,privileged",
};