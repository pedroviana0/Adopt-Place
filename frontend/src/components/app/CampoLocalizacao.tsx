import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buscarMunicipios,
  consultarCep,
  mascaraCep,
  somenteDigitos,
  type MunicipioOpcao,
} from "@/lib/data/localizacao";

export interface LocalizacaoValor {
  cep: string;
  municipioId?: string;
}

interface Props {
  valor: LocalizacaoValor;
  onChange: (valor: LocalizacaoValor) => void;
  /** Recebe o logradouro do CEP, para o formulário preencher o endereço. */
  onLogradouro?: (logradouro: string, bairro: string | null) => void;
  disabled?: boolean;
  erro?: string;
}

type Situacao =
  | { tipo: "vazio" }
  | { tipo: "consultando" }
  | { tipo: "encontrado"; cidade: string; estado: string }
  | { tipo: "nao_encontrado" }
  | { tipo: "indisponivel" };

/**
 * CEP como única entrada de localização. Cidade e UF aparecem confirmadas, em
 * somente leitura, porque quem as decide é o servidor a partir do CEP — deixar
 * editável reabriria a porta para cidade digitada errada, que é justamente o
 * que fazia a distância mentir.
 *
 * Quando a consulta está fora do ar, a pessoa escolhe o município numa lista da
 * nossa própria base e o cadastro segue: a coordenada resultante é a mesma.
 */
export function CampoLocalizacao({
  valor,
  onChange,
  onLogradouro,
  disabled = false,
  erro,
}: Props) {
  const id = useId();
  const [situacao, setSituacao] = useState<Situacao>({ tipo: "vazio" });
  const [buscaMunicipio, setBuscaMunicipio] = useState("");
  const [opcoes, setOpcoes] = useState<MunicipioOpcao[]>([]);
  const ultimoConsultado = useRef<string>("");

  const digitos = somenteDigitos(valor.cep);

  useEffect(() => {
    if (digitos.length !== 8) {
      ultimoConsultado.current = "";
      setSituacao({ tipo: "vazio" });
      return;
    }
    if (ultimoConsultado.current === digitos) return;

    ultimoConsultado.current = digitos;
    let cancelado = false;
    setSituacao({ tipo: "consultando" });

    void consultarCep(digitos).then((resultado) => {
      if (cancelado) return;

      if (resultado.situacao === "encontrado") {
        const { cidade, estado, municipioId, logradouro, bairro } = resultado.endereco;
        setSituacao({ tipo: "encontrado", cidade, estado });
        onChange({ cep: digitos, municipioId });
        if (logradouro) onLogradouro?.(logradouro, bairro);
        return;
      }

      setSituacao({ tipo: resultado.situacao });
      onChange({ cep: digitos, municipioId: undefined });
    });

    return () => {
      cancelado = true;
    };
    // onChange/onLogradouro sao recriados a cada render do formulario; depender
    // deles reconsultaria o CEP sem parar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digitos]);

  useEffect(() => {
    if (situacao.tipo !== "indisponivel") return;
    let cancelado = false;
    const t = setTimeout(() => {
      void buscarMunicipios(buscaMunicipio).then((m) => {
        if (!cancelado) setOpcoes(m);
      });
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [buscaMunicipio, situacao.tipo]);

  const municipioEscolhido = opcoes.find((m) => m.codigoIbge === valor.municipioId);

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`${id}-cep`}>CEP</Label>
        <Input
          id={`${id}-cep`}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          maxLength={9}
          disabled={disabled}
          value={mascaraCep(valor.cep)}
          onChange={(e) =>
            onChange({ cep: somenteDigitos(e.target.value), municipioId: undefined })
          }
          aria-describedby={`${id}-situacao`}
          aria-invalid={situacao.tipo === "nao_encontrado" || Boolean(erro)}
        />

        <p
          id={`${id}-situacao`}
          aria-live="polite"
          className="mt-1.5 flex items-center gap-1.5 text-sm"
        >
          {situacao.tipo === "consultando" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span className="text-muted-foreground">Consultando CEP…</span>
            </>
          )}
          {situacao.tipo === "encontrado" && (
            <>
              <MapPin className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              <span className="font-medium">
                {situacao.cidade}/{situacao.estado}
              </span>
            </>
          )}
          {situacao.tipo === "nao_encontrado" && (
            <span className="text-destructive">
              CEP não encontrado. Confira os números.
            </span>
          )}
          {situacao.tipo === "indisponivel" && (
            <span className="text-muted-foreground">
              A consulta de CEP está fora do ar. Escolha sua cidade abaixo para continuar.
            </span>
          )}
          {situacao.tipo === "vazio" && (
            <span className="text-muted-foreground">
              A cidade é preenchida a partir do CEP.
            </span>
          )}
          {erro && situacao.tipo !== "nao_encontrado" && (
            <span className="text-destructive">{erro}</span>
          )}
        </p>
      </div>

      {situacao.tipo === "indisponivel" && (
        <div className="rounded-lg border border-border bg-surface p-3">
          <Label htmlFor={`${id}-municipio`}>Cidade</Label>
          <Input
            id={`${id}-municipio`}
            placeholder="Digite o nome da cidade"
            disabled={disabled}
            value={buscaMunicipio}
            onChange={(e) => setBuscaMunicipio(e.target.value)}
            autoComplete="off"
          />

          {municipioEscolhido && (
            <p className="mt-2 text-sm font-medium">
              Selecionada: {municipioEscolhido.nome}/{municipioEscolhido.uf}
            </p>
          )}

          {opcoes.length > 0 && (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {opcoes.map((m) => (
                <li key={m.codigoIbge}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ cep: digitos, municipioId: m.codigoIbge })}
                    aria-pressed={valor.municipioId === m.codigoIbge}
                    className="w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                  >
                    {m.nome}/{m.uf}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
