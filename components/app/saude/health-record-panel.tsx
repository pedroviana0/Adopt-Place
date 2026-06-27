"use client"

import { useState, useTransition } from "react"
import { TipoRegistroSaude } from "@prisma/client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { deleteRegistroSaude, createRegistroSaude } from "@/lib/actions/registro-saude"
import type { RegistroSaudeInput } from "@/lib/schemas/registro-saude"

interface HealthRecord {
  id: string
  tipo: TipoRegistroSaude
  dataAplicacao: Date
  dataProximaDose: Date | null
  resultado: string | null
  nomeCustom: string | null
  tipoMedicacao: string | null
  frequencia: string | null
  vacinaId: string | null
}

interface HealthRecordPanelProps {
  records: HealthRecord[]
  animalId: string
  canEdit: boolean
}

interface VacinaFormState {
  nomeCustom: string
  dataAplicacao: string
  dataProximaDose: string
}

interface ParasitaFormState {
  tipoMedicacao: string
  frequencia: string
  dataAplicacao: string
  dataProxima: string
}

interface TesteFormState {
  nomeCustom: string
  dataAplicacao: string
  resultado: string
}

function RecordRow({
  record,
  canEdit,
  onDelete,
  isDeleting,
}: {
  record: HealthRecord
  canEdit: boolean
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="space-y-1 text-sm">
        {record.nomeCustom && <p className="font-medium">{record.nomeCustom}</p>}
        {record.tipoMedicacao && <p>Medicação: {record.tipoMedicacao}</p>}
        {record.frequencia && <p>Frequência: {record.frequencia}</p>}
        {record.resultado && <p>Resultado: {record.resultado}</p>}
        <p>Aplicação: {new Date(record.dataAplicacao).toLocaleDateString("pt-BR")}</p>
        {record.dataProximaDose && (
          <p>Próxima dose: {new Date(record.dataProximaDose).toLocaleDateString("pt-BR")}</p>
        )}
      </div>
      {canEdit && (
        <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
          {isDeleting ? "Removendo..." : "Excluir"}
        </Button>
      )}
    </div>
  )
}

function AddVacinaForm({ animalId, onSuccess }: { animalId: string; onSuccess: () => void }) {
  const [form, setForm] = useState<VacinaFormState>({ nomeCustom: "", dataAplicacao: "", dataProximaDose: "" })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: RegistroSaudeInput = {
      tipoRegistro: "VACINA",
      nomeCustom: form.nomeCustom,
      dataAplicacao: new Date(form.dataAplicacao),
      dataProximaDose: form.dataProximaDose ? new Date(form.dataProximaDose) : undefined,
    }
    startTransition(async () => {
      const result = await createRegistroSaude(animalId, payload)
      if (result.error) { setError(result.error) } else { setForm({ nomeCustom: "", dataAplicacao: "", dataProximaDose: "" }); onSuccess() }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Nome da vacina</label>
        <Input value={form.nomeCustom} onChange={(e) => setForm((p) => ({ ...p, nomeCustom: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Data de aplicação</label>
        <Input type="date" value={form.dataAplicacao} onChange={(e) => setForm((p) => ({ ...p, dataAplicacao: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Próxima dose</label>
        <Input type="date" value={form.dataProximaDose} onChange={(e) => setForm((p) => ({ ...p, dataProximaDose: e.target.value }))} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Adicionar"}
      </Button>
    </form>
  )
}

function AddParasitaForm({ animalId, onSuccess }: { animalId: string; onSuccess: () => void }) {
  const [form, setForm] = useState<ParasitaFormState>({ tipoMedicacao: "", frequencia: "", dataAplicacao: "", dataProxima: "" })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: RegistroSaudeInput = {
      tipoRegistro: "CONTROLE_PARASITAS",
      tipoMedicacao: form.tipoMedicacao,
      frequencia: form.frequencia,
      dataAplicacao: new Date(form.dataAplicacao),
      dataProxima: form.dataProxima ? new Date(form.dataProxima) : undefined,
    }
    startTransition(async () => {
      const result = await createRegistroSaude(animalId, payload)
      if (result.error) { setError(result.error) } else { setForm({ tipoMedicacao: "", frequencia: "", dataAplicacao: "", dataProxima: "" }); onSuccess() }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Tipo de medicação</label>
        <Input value={form.tipoMedicacao} onChange={(e) => setForm((p) => ({ ...p, tipoMedicacao: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Frequência</label>
        <Input value={form.frequencia} onChange={(e) => setForm((p) => ({ ...p, frequencia: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Data de aplicação</label>
        <Input type="date" value={form.dataAplicacao} onChange={(e) => setForm((p) => ({ ...p, dataAplicacao: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Próxima dose</label>
        <Input type="date" value={form.dataProxima} onChange={(e) => setForm((p) => ({ ...p, dataProxima: e.target.value }))} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Adicionar"}
      </Button>
    </form>
  )
}

function AddTesteForm({ animalId, onSuccess }: { animalId: string; onSuccess: () => void }) {
  const [form, setForm] = useState<TesteFormState>({ nomeCustom: "", dataAplicacao: "", resultado: "" })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: RegistroSaudeInput = {
      tipoRegistro: "TESTE_DOENCA",
      nomeCustom: form.nomeCustom,
      resultado: form.resultado as "POSITIVO" | "NEGATIVO",
      dataAplicacao: new Date(form.dataAplicacao),
    }
    startTransition(async () => {
      const result = await createRegistroSaude(animalId, payload)
      if (result.error) { setError(result.error) } else { setForm({ nomeCustom: "", dataAplicacao: "", resultado: "" }); onSuccess() }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Nome do teste</label>
        <Input value={form.nomeCustom} onChange={(e) => setForm((p) => ({ ...p, nomeCustom: e.target.value }))} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Resultado</label>
        <Select value={form.resultado} onChange={(e) => setForm((p) => ({ ...p, resultado: e.target.value }))}>
          <option value="">Selecione</option>
          <option value="POSITIVO">Positivo</option>
          <option value="NEGATIVO">Negativo</option>
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Data de aplicação</label>
        <Input type="date" value={form.dataAplicacao} onChange={(e) => setForm((p) => ({ ...p, dataAplicacao: e.target.value }))} required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Adicionar"}
      </Button>
    </form>
  )
}

type TabKey = "vacinas" | "parasitas" | "testes"

export function HealthRecordPanel({ records, animalId, canEdit }: HealthRecordPanelProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState<TipoRegistroSaude | null>(null)

  const vacinas = records.filter((r) => r.tipo === TipoRegistroSaude.VACINA)
  const parasitas = records.filter((r) => r.tipo === TipoRegistroSaude.CONTROLE_PARASITAS)
  const testes = records.filter((r) => r.tipo === TipoRegistroSaude.TESTE_DOENCA)

  const hasVacinas = vacinas.length > 0
  const hasParasitas = parasitas.length > 0
  const hasTestes = testes.length > 0

  const tabs: { key: TabKey; label: string; active: boolean }[] = [
    { key: "vacinas", label: "Vacinas", active: hasVacinas },
    { key: "parasitas", label: "Parasitas", active: hasParasitas },
    { key: "testes", label: "Testes", active: hasTestes },
  ].filter((t): t is { key: TabKey; label: string; active: boolean } => t.active)

  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0]?.key ?? "vacinas")

  function handleDelete(id: string) {
    setDeletingId(id)
    deleteRegistroSaude(id).then(() => setDeletingId(null))
  }

  return (
    <div>
      <Tabs>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.key}
              className={activeTab === tab.key ? "bg-white shadow-sm" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {activeTab === "vacinas" && hasVacinas && (
          <TabsContent className="space-y-2">
            {canEdit && (
              <Button onClick={() => setShowAddForm(showAddForm === TipoRegistroSaude.VACINA ? null : TipoRegistroSaude.VACINA)}>
                Adicionar
              </Button>
            )}
            {showAddForm === TipoRegistroSaude.VACINA && (
              <AddVacinaForm animalId={animalId} onSuccess={() => setShowAddForm(null)} />
            )}
            {vacinas.map((r) => (
              <RecordRow key={r.id} record={r} canEdit={canEdit} onDelete={() => handleDelete(r.id)} isDeleting={deletingId === r.id} />
            ))}
          </TabsContent>
        )}

        {activeTab === "parasitas" && hasParasitas && (
          <TabsContent className="space-y-2">
            {canEdit && (
              <Button onClick={() => setShowAddForm(showAddForm === TipoRegistroSaude.CONTROLE_PARASITAS ? null : TipoRegistroSaude.CONTROLE_PARASITAS)}>
                Adicionar
              </Button>
            )}
            {showAddForm === TipoRegistroSaude.CONTROLE_PARASITAS && (
              <AddParasitaForm animalId={animalId} onSuccess={() => setShowAddForm(null)} />
            )}
            {parasitas.map((r) => (
              <RecordRow key={r.id} record={r} canEdit={canEdit} onDelete={() => handleDelete(r.id)} isDeleting={deletingId === r.id} />
            ))}
          </TabsContent>
        )}

        {activeTab === "testes" && hasTestes && (
          <TabsContent className="space-y-2">
            {canEdit && (
              <Button onClick={() => setShowAddForm(showAddForm === TipoRegistroSaude.TESTE_DOENCA ? null : TipoRegistroSaude.TESTE_DOENCA)}>
                Adicionar
              </Button>
            )}
            {showAddForm === TipoRegistroSaude.TESTE_DOENCA && (
              <AddTesteForm animalId={animalId} onSuccess={() => setShowAddForm(null)} />
            )}
            {testes.map((r) => (
              <RecordRow key={r.id} record={r} canEdit={canEdit} onDelete={() => handleDelete(r.id)} isDeleting={deletingId === r.id} />
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
