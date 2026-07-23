import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Link2 } from "lucide-react";
import { useDbVersion } from "@/lib/data/hooks";
import { listAnimais, listRelacionados, addRelacionamento, removeRelacionamento, fotoPrincipal } from "@/lib/data/animais";
import type { SessaoUsuario } from "@/lib/domain/types";

interface Props { animalId: string; sessao: SessaoUsuario }

export function RelatedAnimalsPanel({ animalId, sessao }: Props) {
  useDbVersion();
  const [busca, setBusca] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const vinculos = listRelacionados(animalId);
  const idsVinculados = new Set(vinculos.map((v) => v.id));

  const candidatos = useMemo(() => {
    const meus = listAnimais({ ownerId: { organizacaoId: sessao.organizacaoId, acolhedorId: sessao.acolhedorId } });
    const q = busca.trim().toLowerCase();
    return meus
      .filter((a) => a.id !== animalId && !idsVinculados.has(a.id))
      .filter((a) => (q ? a.nome.toLowerCase().includes(q) : true))
      .slice(0, 10);
  }, [busca, animalId, sessao.organizacaoId, sessao.acolhedorId, idsVinculados]);

  const doVincular = (outroId: string) => {
    setSaving(outroId);
    try { addRelacionamento(animalId, outroId); toast.success("Vinculado"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setSaving(null); }
  };

  const doDesvincular = (outroId: string) => {
    setSaving(outroId);
    try { removeRelacionamento(animalId, outroId); toast.success("Desvinculado"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setSaving(null); }
  };

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold">Animais relacionados</h2>
      <p className="text-sm text-muted-foreground">Vincule animais que costumam ser adotados juntos (irmãos, dupla).</p>

      <div className="mt-4">
        <Label htmlFor="busca-rel" className="mb-1 block text-sm">Buscar entre meus animais</Label>
        <Input id="busca-rel" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome…" />
        {candidatos.length > 0 && (
          <ul className="mt-2 divide-y rounded-xl border bg-card">
            {candidatos.map((a) => {
              const foto = fotoPrincipal(a.id);
              return (
                <li key={a.id} className="flex items-center gap-3 p-2">
                  {foto && <img src={foto.urlFoto} alt="" className="h-10 w-10 rounded-md object-cover" />}
                  <span className="flex-1 text-sm">{a.nome}</span>
                  <Button size="sm" variant="outline" disabled={saving === a.id} onClick={() => doVincular(a.id)}>
                    <Link2 className="mr-1 h-3.5 w-3.5" />{saving === a.id ? "Vinculando..." : "Vincular"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Vínculos atuais ({vinculos.length})</p>
        {vinculos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum vínculo.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {vinculos.map((v) => {
              const foto = fotoPrincipal(v.id);
              return (
                <li key={v.id} className="flex items-center gap-3 p-2">
                  {foto && <img src={foto.urlFoto} alt="" className="h-10 w-10 rounded-md object-cover" />}
                  <span className="flex-1 text-sm">{v.nome}</span>
                  <Button size="sm" variant="ghost" aria-label={`Desvincular ${v.nome}`} disabled={saving === v.id} onClick={() => doDesvincular(v.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
