import { connect } from "node:net";

/**
 * Falha o `npm run dev` quando a porta ja esta ocupada.
 *
 * Sem esta guarda, tanto o Next quanto o Vite caem em outra porta **em
 * silencio** — "Port 3000 is in use, trying another one". O resultado nao e um
 * erro, e algo pior: dois servidores do mesmo projeto rodando ao mesmo tempo.
 *
 * Foi o que aconteceu nesta base e custou tempo em tres frentes:
 * 1. o navegador continuava na porta antiga, servindo codigo velho, e a
 *    impressao era de que a alteracao nao tinha funcionado;
 * 2. o proxy do frontend aponta para :3000 fixo, entao um backend em :3002
 *    nao atendia ninguem;
 * 3. dois processos Next escrevendo no mesmo `.next` corromperam o cache de
 *    build e produziram um 500 com "Unexpected end of JSON input" no endpoint
 *    publico da vitrine — um erro que nao aponta para a causa.
 *
 * A verificacao e por **conexao**, nao por bind. Tentar ligar em 127.0.0.1
 * pode ter sucesso no Windows mesmo com outro processo ocupando 0.0.0.0 na
 * mesma porta, e a guarda deixaria passar exatamente o caso que existe para
 * impedir. Conectar responde a pergunta certa: tem alguem atendendo ali?
 */

const porta = Number(process.argv[2]);
const rotulo = process.argv[3] ?? "servidor";
const TEMPO_LIMITE_MS = 1500;

if (!Number.isInteger(porta) || porta <= 0 || porta > 65535) {
  console.error(`porta-livre: porta invalida: ${process.argv[2]}`);
  process.exit(1);
}

function estaOcupada(host) {
  return new Promise((resolve) => {
    const socket = connect({ port: porta, host });
    const encerrar = (ocupada) => {
      socket.destroy();
      resolve(ocupada);
    };

    socket.setTimeout(TEMPO_LIMITE_MS);
    socket.once("connect", () => encerrar(true));
    socket.once("timeout", () => encerrar(false));
    socket.once("error", () => encerrar(false));
  });
}

// 127.0.0.1 e ::1 sao pontos de entrada distintos no Windows; um servidor pode
// atender so num deles.
const ocupada = (await estaOcupada("127.0.0.1")) || (await estaOcupada("::1"));

if (!ocupada) {
  process.exit(0);
}

const ehWindows = process.platform === "win32";
const comoAchar = ehWindows
  ? `Get-NetTCPConnection -LocalPort ${porta} -State Listen | Select-Object OwningProcess`
  : `lsof -i :${porta}`;
const comoEncerrar = ehWindows ? "Stop-Process -Id <PID> -Force" : "kill <PID>";

console.error(
  [
    "",
    `  A porta ${porta} ja esta em uso — o ${rotulo} nao vai subir.`,
    "",
    "  Isto e proposital. Sem esta checagem o servidor subiria numa porta",
    "  diferente sem avisar, e voce ficaria olhando para a versao antiga do",
    "  sistema achando que a alteracao nao funcionou.",
    "",
    "  Se o servidor que voce quer ja esta rodando, use o que esta no ar.",
    "  Se sobrou um processo orfao, encontre e encerre:",
    "",
    `    ${comoAchar}`,
    `    ${comoEncerrar}`,
    "",
  ].join("\n"),
);
process.exit(1);
