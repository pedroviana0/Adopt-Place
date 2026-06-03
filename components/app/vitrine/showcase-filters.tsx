import { Search, X } from "lucide-react";
import Link from "next/link";

import { Button, Form, FormItem, FormLabel, Input, Select } from "@/components/ui";
import type { ShowcaseFilters } from "@/lib/schemas/showcase";

type ShowcaseFiltersProps = {
  filters: ShowcaseFilters;
  options: {
    especies: {
      id: string;
      nome: string;
      racas: { id: string; nome: string; especieId: string }[];
    }[];
    cities: string[];
  };
};

const tagOptions = [
  { value: "castrado", label: "Castrado" },
  { value: "vacinado", label: "Vacinado" },
  { value: "vermifugado", label: "Vermifugado" },
  { value: "testado", label: "Testado" },
] as const;

export function ShowcaseFilters({ filters, options }: ShowcaseFiltersProps) {
  const selectedSpecies = options.especies.find((especie) => especie.id === filters.especieId);
  const breedOptions = selectedSpecies?.racas ?? options.especies.flatMap((especie) => especie.racas);

  return (
    <Form action="/" className="rounded-md border bg-white p-4">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <FormItem>
          <FormLabel htmlFor="especieId">Especie</FormLabel>
          <Select id="especieId" name="especieId" defaultValue={filters.especieId ?? ""}>
            <option value="">Todas</option>
            {options.especies.map((especie) => (
              <option key={especie.id} value={especie.id}>
                {especie.nome}
              </option>
            ))}
          </Select>
        </FormItem>
        <FormItem>
          <FormLabel htmlFor="racaId">Raca</FormLabel>
          <Select id="racaId" name="racaId" defaultValue={filters.racaId ?? ""}>
            <option value="">Todas</option>
            {breedOptions.map((raca) => (
              <option key={raca.id} value={raca.id}>
                {raca.nome}
              </option>
            ))}
          </Select>
        </FormItem>
        <FormItem>
          <FormLabel htmlFor="porte">Porte</FormLabel>
          <Select id="porte" name="porte" defaultValue={filters.porte ?? ""}>
            <option value="">Todos</option>
            <option value="P">Pequeno</option>
            <option value="M">Medio</option>
            <option value="G">Grande</option>
          </Select>
        </FormItem>
        <FormItem>
          <FormLabel htmlFor="sexo">Sexo</FormLabel>
          <Select id="sexo" name="sexo" defaultValue={filters.sexo ?? ""}>
            <option value="">Todos</option>
            <option value="M">Macho</option>
            <option value="F">Femea</option>
          </Select>
        </FormItem>
        <FormItem>
          <FormLabel htmlFor="cidade">Cidade</FormLabel>
          <Input id="cidade" name="cidade" list="cidades" defaultValue={filters.cidade ?? ""} />
          <datalist id="cidades">
            {options.cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </FormItem>
        <div className="flex items-end gap-2">
          <Button type="submit" className="w-full gap-2">
            <Search aria-hidden="true" size={16} />
            Filtrar
          </Button>
          <Link
            href="/"
            aria-label="Limpar filtros"
            className="inline-flex h-10 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition hover:bg-[var(--muted)]"
          >
            <X aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
      <fieldset className="mt-4 flex flex-wrap gap-3">
        <legend className="sr-only">Tags</legend>
        {tagOptions.map((tag) => (
          <label key={tag.value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              name="tags"
              value={tag.value}
              defaultChecked={filters.tags.includes(tag.value)}
            />
            {tag.label}
          </label>
        ))}
      </fieldset>
    </Form>
  );
}
