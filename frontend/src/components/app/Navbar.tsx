import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessao } from "@/lib/data/hooks";
import { logout } from "@/lib/data/sessao";
import { fetchUnreadCount } from "@/lib/data/mensagens";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Navbar() {
  const sessao = useSessao();
  const router = useRouter();
  const isAdopter = sessao?.tipoPerfil === "ADOTANTE";
  const unreadQuery = useQuery({
    queryKey: ["mensagens-unread"],
    queryFn: fetchUnreadCount,
    enabled: isAdopter,
    refetchInterval: 30_000,
  });
  const unread = unreadQuery.data ?? 0;

  const doLogout = async () => {
    await logout();
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden gap-4 md:flex">
            <Link
              to="/vitrine"
              className="text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              Adotar
            </Link>
            {isAdopter && (
              <Link
                to="/mensagens"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Mensagens
                {unread > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                    {unread}
                  </span>
                )}
              </Link>
            )}
            {(sessao?.tipoPerfil === "ORGANIZACAO" || sessao?.tipoPerfil === "ACOLHEDOR") && (
              <Link
                to="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Meu Painel
              </Link>
            )}
            {sessao?.tipoPerfil === "ADMIN" && (
              <Link
                to="/dashboard/admin/usuarios"
                className="text-sm text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!sessao ? (
            <>
              <Button variant="ghost" asChild size="sm">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {initials(sessao.nome)}
                  </span>
                  <span className="hidden sm:inline">{sessao.nome}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{sessao.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sessao.tipoPerfil === "ADOTANTE" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/meu-perfil">Meu perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/triagem">Minha triagem</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/minhas-solicitacoes">Minhas solicitações</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/mensagens" className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>Mensagens</span>
                        {unread > 0 && (
                          <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                            {unread}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/meus-favoritos">Meus favoritos</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {(sessao.tipoPerfil === "ORGANIZACAO" || sessao.tipoPerfil === "ACOLHEDOR") && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Meu painel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={doLogout} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
