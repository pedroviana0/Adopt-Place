export function formatPublicFosterName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "Acolhedor";
  const lastName = parts.length > 1 ? parts.at(-1) : null;

  return lastName ? `${firstName} ${lastName[0]?.toUpperCase()}.` : firstName;
}
