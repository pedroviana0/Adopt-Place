// Telefone guardado so com digitos (phoneSchema) exibido como (DD) 99999-9999.
export function formatarTelefone(digitos: string): string {
  return digitos.length === 11
    ? `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
    : digitos.length === 10
      ? `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
      : digitos;
}
