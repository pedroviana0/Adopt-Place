import { z } from "zod";

const digits = (value: string) => value.replace(/\D/g, "");

const validCpf = (value: string) => {
  const cpf = digits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    const sum = cpf.slice(0, length).split("").reduce(
      (total, current, index) => total + Number(current) * (length + 1 - index), 0,
    );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
};

const validCnpj = (value: string) => {
  const cnpj = digits(value);
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calculate = (length: 12 | 13) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = cnpj.slice(0, length).split("").reduce(
      (total, current, index) => total + Number(current) * weights[index], 0,
    );
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return calculate(12) === Number(cnpj[12]) && calculate(13) === Number(cnpj[13]);
};

export const emailSchema = z.string().trim().toLowerCase()
  .max(254, "O e-mail deve ter no máximo 254 caracteres.")
  .email("Informe um e-mail válido.");
export const passwordSchema = z.string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.");
export const cpfSchema = z.string().trim().refine(validCpf, "Informe um CPF válido.").transform(digits);
export const cnpjSchema = z.string().trim().refine(validCnpj, "Informe um CNPJ válido.").transform(digits);
export const phoneSchema = z.string().trim().transform(digits)
  .refine((value) => /^[1-9]{2}9?\d{8}$/.test(value), "Informe um telefone brasileiro com DDD.");
export const personNameSchema = z.string().trim()
  .min(3, "Informe um nome válido.")
  .max(120, "O nome deve ter no máximo 120 caracteres.")
  .refine((value) => /[A-Za-zÀ-ÖØ-öø-ÿ]{2}/u.test(value) && !/\d/u.test(value), "Informe um nome válido, sem números.");
export const addressSchema = z.string().trim().min(3, "Informe um endereço válido.")
  .max(200, "O endereço deve ter no máximo 200 caracteres.");
