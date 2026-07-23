import { loadDB } from "./db";

export const listEspecies = () => loadDB().especies;
export const listRacas = (especieId?: string) =>
  loadDB().racas.filter((r) => !especieId || r.especieId === especieId);
export const listVacinas = () => loadDB().vacinas;
export const listDoencas = () => loadDB().doencas;
