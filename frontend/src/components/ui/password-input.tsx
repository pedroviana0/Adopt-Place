import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  /** Classe do botão de revelar, para o campo em fundo escuro do login. */
  toggleClassName?: string;
};

/**
 * Campo de senha com botão de revelar.
 *
 * Digitar senha às cegas é a maior causa de erro de acesso, e no cadastro é
 * pior: a pessoa erra sem perceber e só descobre no primeiro login, quando já
 * não tem como conferir o que digitou.
 *
 * O estado nasce oculto e volta a ocultar quando o campo perde o foco, para a
 * senha não ficar exposta na tela depois que a pessoa seguiu adiante.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, toggleClassName, onBlur, ...props }, ref) {
    const [visivel, setVisivel] = React.useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={visivel ? "text" : "password"}
          // Espaço para o botão não cobrir o que está sendo digitado.
          className={cn("pr-10", className)}
          onBlur={(evento) => {
            // O clique no botão dispara blur antes do click; adiar deixa o
            // toggle funcionar em vez de a senha reocultar no meio do caminho.
            window.setTimeout(() => setVisivel(false), 0);
            onBlur?.(evento);
          }}
        />
        <button
          type="button"
          // Fora da ordem de tabulação: quem navega por teclado quer ir do
          // campo direto para o botão de entrar, não passar por aqui.
          tabIndex={-1}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => setVisivel((atual) => !atual)}
          className={cn(
            "absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            toggleClassName,
          )}
        >
          {visivel ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);
