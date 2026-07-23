import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Heart, Send, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getAnimal, listFotos, listRelacionados } from "@/lib/data/animais";
import { listRegistros } from "@/lib/data/saude";
import { computeTags } from "@/lib/domain/tags";
import { TagBadge } from "@/components/app/TagBadge";
import { StatusBadge } from "@/components/app/StatusBadge";
import { getAcolhedor, getAdotante, getOrganizacao } from "@/lib/data/usuarios";
import { listEspecies, listRacas } from "@/lib/data/catalogos";
import { useDbVersion, useSessao } from "@/lib/data/hooks";
import { isFavorito, toggleFavorito } from "@/lib/data/favoritos";
import { createSolicitacao } from "@/lib/data/solicitacoes";
import { AnimalCard } from "@/components/app/AnimalCard";
import { toast } from "sonner";
import { tipoRegistroSaudeLabel } from "@/lib/domain/enums";

export const Route = createFileRoute("/animais/$animalId")({
  head: ({ params }) => {
    const a = getAnimal(params.animalId);
    const foto = a ? listFotos(a.id)[0] : undefined;
    const title = a ? `${a.nome} — AdoptPlace` : "Animal — AdoptPlace";
    const desc = a?.descricao ?? "Conheça este animal disponível para adoção no AdoptPlace.";
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (foto) {
      meta.push({ property: "og:image", content: foto.urlFoto });
      meta.push({ name: "twitter:image", content: foto.urlFoto });
    }
    return { meta };
  },
  component: AnimalDetail,
});

function AnimalDetail() {
  useDbVersion();
  const { animalId } = Route.useParams();
  const sessao = useSessao();
  const router = useRouter();
  const navigate = useNavigate();
  const animal = getAnimal(animalId);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [favSaving, setFavSaving] = useState(false);
  const [solSaving, setSolSaving] = useState(false);

  if (!animal) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-semibold">Animal não encontrado</h1>
        <Button asChild className="mt-4"><Link to="/vitrine">Voltar à vitrine</Link></Button>
      </div>
    );
  }

  const fotos = listFotos(animal.id);
  const registros = listRegistros(animal.id);
  const tags = computeTags(animal, registros);
  const relacionados = listRelacionados(animal.id);
  const especie = listEspecies().find((e) => e.id === animal.especieId);
  const raca = listRacas().find((r) => r.id === animal.racaId);
  const org = animal.organizacaoId ? getOrganizacao(animal.organizacaoId) : null;
  const aco = animal.acolhedorId ? getAcolhedor(animal.acolhedorId) : null;
  const responsavelPublico = org
    ? { tipo: "Organização", nome: org.razaoSocial, cidade: org.cidade }
    : aco
      ? { tipo: "Acolhedor independente", nome: aco.nomeCompleto, cidade: aco.cidade }
      : null;

  const currentPath = router.state.location.pathname;
  const requireLogin = () => {
    navigate({ to: "/login", search: { next: currentPath } });
  };

  const favorited = sessao?.adotanteId ? isFavorito(sessao.adotanteId, animal.id) : false;

  const handleFavoritar = () => {
    if (!sessao || sessao.tipoPerfil !== "ADOTANTE") {
      if (sessao) toast.error("Apenas adotantes podem favoritar animais.");
      else requireLogin();
      return;
    }
    setFavSaving(true);
    try {
      const now = toggleFavorito(sessao.adotanteId!, animal.id);
      toast.success(now ? "Adicionado aos favoritos" : "Removido dos favoritos");
    } finally {
      setFavSaving(false);
    }
  };
  const handleSolicitar = () => {
    if (!sessao) return requireLogin();
    if (sessao.tipoPerfil !== "ADOTANTE") {
      toast.error("Somente adotantes podem solicitar adoção.");
      return;
    }
    const adot = sessao.adotanteId ? getAdotante(sessao.adotanteId) : undefined;
    if (!adot?.triagemConcluida) {
      toast.error("Você precisa concluir a triagem antes de solicitar uma adoção.");
      navigate({ to: "/triagem" });
      return;
    }
    setSolSaving(true);
    try {
      createSolicitacao(sessao.adotanteId!, animal.id);
      toast.success("Solicitação enviada! Acompanhe em Minhas solicitações.");
      navigate({ to: "/minhas-solicitacoes" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao solicitar";
      toast.error(msg);
    } finally {
      setSolSaving(false);
    }
  };

  const vacinas = registros.filter((r) => r.tipo === "VACINA");
  const parasitas = registros.filter((r) => r.tipo === "CONTROLE_PARASITAS");
  const testes = registros.filter((r) => r.tipo === "TESTE_DOENCA");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {fotos.length > 0 && (
            <>
              <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
                <img src={fotos[selectedPhoto]?.urlFoto} alt={animal.nome} className="h-full w-full object-cover" />
              </div>
              {fotos.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {fotos.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedPhoto(i)}
                      className={`aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === selectedPhoto ? "border-primary" : "border-transparent"}`}
                    >
                      <img src={f.urlFoto} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={animal.status} />
            {responsavelPublico && (
              <span className="text-xs text-muted-foreground">
                <MapPin className="mr-0.5 inline h-3 w-3" />
                {responsavelPublico.cidade}
              </span>
            )}
          </div>
          <h1 className="mt-2 font-serif text-4xl font-semibold">{animal.nome}</h1>
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.map((t, i) => <TagBadge key={i} tag={t} />)}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 text-sm">
            <Attr label="Espécie" value={especie?.nome ?? "—"} />
            <Attr label="Raça" value={raca?.nome ?? "SRD"} />
            <Attr label="Cor" value={animal.cor} />
            <Attr label="Idade" value={animal.idadeEstimada ?? "—"} />
          </dl>

          {animal.descricao && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{animal.descricao}</p>
          )}

          {responsavelPublico && (
            <div className="mt-4 rounded-xl border bg-card p-4 text-sm">
              <p className="text-xs text-muted-foreground">Responsável</p>
              <p className="font-medium">{responsavelPublico.nome}</p>
              <p className="text-xs text-muted-foreground">{responsavelPublico.tipo} · {responsavelPublico.cidade}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2">
            {animal.status === "DISPONIVEL" && (
              <Button size="lg" onClick={handleSolicitar} disabled={solSaving} className="w-full gap-2">
                <Send className="h-4 w-4" /> {solSaving ? "Enviando..." : "Solicitar adoção"}
              </Button>
            )}
            <Button size="lg" variant={favorited ? "default" : "outline"} onClick={handleFavoritar} disabled={favSaving} className="w-full gap-2">
              <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} /> {favSaving ? "Salvando..." : favorited ? "Favoritado" : "Favoritar"}
            </Button>
          </div>
        </div>
      </div>

      {(vacinas.length > 0 || parasitas.length > 0 || testes.length > 0) && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold">Saúde</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {vacinas.length > 0 && (
              <HealthSection title={tipoRegistroSaudeLabel.VACINA}>
                <ul className="space-y-1 text-sm">
                  {vacinas.map((r) => <li key={r.id}>• {r.nomeVacina}</li>)}
                </ul>
              </HealthSection>
            )}
            {parasitas.length > 0 && (
              <HealthSection title={tipoRegistroSaudeLabel.CONTROLE_PARASITAS}>
                <ul className="space-y-1 text-sm">
                  {parasitas.map((r) => <li key={r.id}>• {r.tipoMedicamento}{r.frequencia ? ` — ${r.frequencia}` : ""}</li>)}
                </ul>
              </HealthSection>
            )}
            {testes.length > 0 && (
              <HealthSection title={tipoRegistroSaudeLabel.TESTE_DOENCA}>
                <ul className="space-y-1 text-sm">
                  {testes.map((r) => <li key={r.id}>• {r.nomeDoenca}</li>)}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Resultados detalhados disponíveis ao responsável.</p>
              </HealthSection>
            )}
          </div>
        </section>
      )}

      {relacionados.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-2xl font-semibold">Animais relacionados</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((a) => <AnimalCard key={a.id} animal={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function HealthSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-2 text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}
