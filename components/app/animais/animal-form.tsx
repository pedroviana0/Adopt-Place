"use client"

import { useState } from "react"
import { StatusAnimal } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import type { AnimalInput } from "@/lib/schemas/animal"

interface AnimalFormProps {
  onSubmit: (data: AnimalInput) => Promise<{ id?: string; error?: string } | { success?: boolean; error?: string }>
  defaultValues?: Partial<AnimalInput>
  speciesList: { id: string; nome: string }[]
  racasList: { id: string; nome: string; especieId: string }[]
  isLoading?: boolean
  ownerField: { organizacaoId: string | null; acolhedorId: string | null }
}

const statusOptions: { value: StatusAnimal; label: string }[] = [
  { value: StatusAnimal.RESGATADO, label: "Resgatado" },
  { value: StatusAnimal.EM_CUIDADOS, label: "Em cuidados" },
  { value: StatusAnimal.DISPONIVEL, label: "Disponível" },
  { value: StatusAnimal.EM_PROCESSO_ADOCAO, label: "Em processo de adoção" },
  { value: StatusAnimal.ADOTADO, label: "Adotado" },
]

export function AnimalForm({
  onSubmit,
  defaultValues,
  speciesList,
  racasList,
  isLoading,
  ownerField,
}: AnimalFormProps) {
  const [nome, setNome] = useState(defaultValues?.nome ?? "")
  const [especieId, setEspecieId] = useState(defaultValues?.especieId ?? "")
  const [racaId, setRacaId] = useState(defaultValues?.racaId ?? "")
  const [porte, setPorte] = useState(defaultValues?.porte ?? "M")
  const [sexo, setSexo] = useState(defaultValues?.sexo ?? "M")
  const [cor, setCor] = useState(defaultValues?.cor ?? "")
  const [castrado, setCastrado] = useState(defaultValues?.castrado ?? false)
  const [descricao, setDescricao] = useState(defaultValues?.descricao ?? "")
  const [status, setStatus] = useState<StatusAnimal>(defaultValues?.status ?? StatusAnimal.DISPONIVEL)
  const [idadeEstimada, setIdadeEstimada] = useState(defaultValues?.idadeEstimada ?? "")
  const [error, setError] = useState<string | null>(null)

  const filteredRacas = racasList.filter((r) => r.especieId === especieId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const result = await onSubmit({
      nome,
      especieId,
      racaId: racaId || undefined,
      porte,
      sexo,
      cor,
      castrado,
      descricao,
      status,
      idadeEstimada: idadeEstimada || undefined,
      organizacaoId: ownerField.organizacaoId,
      acolhedorId: ownerField.acolhedorId,
    })

    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nome" className="mb-1 block text-sm font-medium">
          Nome
        </label>
        <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>

      <div>
        <label htmlFor="especieId" className="mb-1 block text-sm font-medium">
          Espécie
        </label>
        <Select id="especieId" value={especieId} onChange={(e) => { setEspecieId(e.target.value); setRacaId("") }}>
          <option value="">Selecione a espécie</option>
          {speciesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="racaId" className="mb-1 block text-sm font-medium">
          Raça
        </label>
        <Select id="racaId" value={racaId} onChange={(e) => setRacaId(e.target.value)}>
          <option value="">Selecione a raça</option>
          {filteredRacas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="porte" className="mb-1 block text-sm font-medium">
          Porte
        </label>
        <Select id="porte" value={porte} onChange={(e) => setPorte(e.target.value as "P" | "M" | "G")}>
          <option value="P">Pequeno</option>
          <option value="M">Médio</option>
          <option value="G">Grande</option>
        </Select>
      </div>

      <div>
        <label htmlFor="sexo" className="mb-1 block text-sm font-medium">
          Sexo
        </label>
        <Select id="sexo" value={sexo} onChange={(e) => setSexo(e.target.value as "M" | "F")}>
          <option value="M">Macho</option>
          <option value="F">Fêmea</option>
        </Select>
      </div>

      <div>
        <label htmlFor="cor" className="mb-1 block text-sm font-medium">
          Cor
        </label>
        <Input id="cor" value={cor} onChange={(e) => setCor(e.target.value)} required />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="castrado"
          type="checkbox"
          checked={castrado}
          onChange={(e) => setCastrado(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="castrado" className="text-sm font-medium">
          Castrado
        </label>
      </div>

      <div>
        <label htmlFor="descricao" className="mb-1 block text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium">
          Status
        </label>
        <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as StatusAnimal)}>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label htmlFor="idadeEstimada" className="mb-1 block text-sm font-medium">
          Idade estimada
        </label>
        <Input
          id="idadeEstimada"
          value={idadeEstimada}
          onChange={(e) => setIdadeEstimada(e.target.value)}
          placeholder="Ex: 2 anos"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}
