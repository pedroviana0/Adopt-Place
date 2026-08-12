import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSessao } from "@/lib/data/hooks";
import { logout } from "@/lib/data/sessao";
import { fetchUnreadCount } from "@/lib/data/mensagens";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const desktopLinkClass =
  "border-b-2 border-transparent py-2 text-sm text-muted-foreground transition-colors hover:text-foreground";
const activeDesktopLink = "border-primary font-medium text-foreground";
const mobileLinkClass =
  "flex min-h-11 items-center justify-between rounded-md border-l-4 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const activeMobileLink = "border-primary bg-selection font-semibold text-selection-foreground";

export function Navbar() {
  const sessao = useSessao();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const firstMobileDestination = useRef<HTMLAnchorElement>(null);
  const isAdopter = sessao?.tipoPerfil === "ADOTANTE";
  const isResponsible = sessao?.tipoPerfil === "ORGANIZACAO" || sessao?.tipoPerfil === "ACOLHEDOR";
  const unreadQuery = useQuery({
    queryKey: ["mensagens-unread"],
    queryFn: fetchUnreadCount,
    enabled: isAdopter,
    refetchInterval: 30_000,
  });
  const unread = unreadQuery.data ?? 0;

  const doLogout = async () => {
    setMobileOpen(false);
    await logout();
    router.navigate({ to: "/" });
  };

  const closeMobileMenu = () => setMobileOpen(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("adoptplace-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    document.documentElement.classList.toggle("dark", shouldUseDark);
    setDarkMode(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const nextDarkMode = !darkMode;
    document.documentElement.classList.toggle("dark", nextDarkMode);
    window.localStorage.setItem("adoptplace-theme", nextDarkMode ? "dark" : "light");
    setDarkMode(nextDarkMode);
  };

  // No topo a barra é sólida (limpa, sem divisória); ao rolar vira vidro.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // O blur fica SEMPRE aplicado; só a opacidade do fundo muda. No topo o fundo
    // é opaco (o blur não aparece) e ao rolar fica translúcido, revelando o vidro.
    // Animar só background-color/box-shadow é confiável — transicionar
    // backdrop-filter a partir de `none` não é.
    <header
      className={cn(
        "sticky top-0 z-40 backdrop-blur-xl backdrop-saturate-150",
        "transition-[background-color,box-shadow] duration-300 ease-out",
        scrolled ? "bg-navbar-glass shadow-sm" : "bg-background shadow-none",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-6">
          <Logo className="shrink-0" />
          <nav aria-label="Navegação principal" className="hidden items-center gap-4 md:flex">
            <Link
              to="/vitrine"
              className={desktopLinkClass}
              activeProps={{ className: activeDesktopLink, "aria-current": "page" }}
            >
              Adotar
            </Link>
            <Link
              to="/busca"
              className={desktopLinkClass}
              activeProps={{ className: activeDesktopLink, "aria-current": "page" }}
            >
              Organizações
            </Link>
            {isAdopter && (
              <Link
                to="/feels"
                className={desktopLinkClass}
                activeProps={{ className: activeDesktopLink, "aria-current": "page" }}
              >
                Feels
              </Link>
            )}
            {isAdopter && (
              <Link
                to="/mensagens"
                className={`${desktopLinkClass} flex items-center gap-1.5`}
                activeProps={{ className: activeDesktopLink, "aria-current": "page" }}
              >
                Mensagens
                {unread > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                    <span className="sr-only">Mensagens não lidas: </span>
                    {unread}
                  </span>
                )}
              </Link>
            )}
            {isResponsible && (
              <Link
                to="/dashboard"
                className={desktopLinkClass}
                activeProps={{ className: activeDesktopLink, "aria-current": "page" }}
              >
                Meu Painel
              </Link>
            )}
            {sessao?.tipoPerfil === "ADMIN" && (
              <Link
                to="/dashboard/admin/usuarios"
                className={desktopLinkClass}
                activeProps={{ className: activeDesktopLink, "aria-current": "page" }}
              >
                Administração
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
            title={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {darkMode ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
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
            <>
              <NotificationBell />
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="max-w-72 gap-2 rounded-full px-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
                      {initials(sessao.nome)}
                    </span>
                    <span className="truncate">{sessao.nome}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="w-72 rounded-xl p-2 shadow-floating"
                >
                  <DropdownMenuLabel className="flex items-center gap-3 rounded-lg bg-muted px-3 py-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {initials(sessao.nome)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {sessao.nome}
                      </span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">
                        {sessao.email}
                      </span>
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sessao.tipoPerfil === "ADOTANTE" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/meu-perfil" className="flex items-center gap-2">
                          <UserRound className="h-4 w-4" aria-hidden="true" />
                          <span>Meu perfil</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/triagem" className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" aria-hidden="true" />
                          <span>Minha triagem</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/minhas-solicitacoes" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" aria-hidden="true" />
                          <span>Minhas solicitações</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/mensagens" className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          <span>Mensagens</span>
                          {unread > 0 && (
                            <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                              <span className="sr-only">Mensagens não lidas: </span>
                              {unread}
                            </span>
                          )}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/meus-favoritos" className="flex items-center gap-2">
                          <Heart className="h-4 w-4" aria-hidden="true" />
                          <span>Meus favoritos</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {isResponsible && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                        <span>Meu painel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={doLogout}
                    className="mt-1 gap-2 bg-destructive text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menu principal"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[min(88vw,22rem)] flex-col p-0"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                firstMobileDestination.current?.focus();
              }}
            >
              <SheetHeader className="border-b border-border px-5 py-5 pr-14 text-left">
                <SheetTitle>Menu principal</SheetTitle>
                <SheetDescription>
                  {sessao ? `Navegação para ${sessao.email}` : "Navegação do AdoptPlace"}
                </SheetDescription>
              </SheetHeader>

              <nav
                aria-label="Navegação principal mobile"
                className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5"
              >
                <Link
                  ref={firstMobileDestination}
                  to="/"
                  activeOptions={{ exact: true }}
                  onClick={closeMobileMenu}
                  className={mobileLinkClass}
                  activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                >
                  Início
                </Link>
                <Link
                  to="/vitrine"
                  onClick={closeMobileMenu}
                  className={mobileLinkClass}
                  activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                >
                  Adotar
                </Link>
                <Link
                  to="/busca"
                  onClick={closeMobileMenu}
                  className={mobileLinkClass}
                  activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                >
                  Organizações
                </Link>

                {sessao?.tipoPerfil === "ADOTANTE" && (
                  <Link
                    to="/feels"
                    onClick={closeMobileMenu}
                    className={mobileLinkClass}
                    activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                  >
                    Feels
                  </Link>
                )}

                {!sessao && (
                  <>
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className={mobileLinkClass}
                      activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/cadastro"
                      onClick={closeMobileMenu}
                      className={mobileLinkClass}
                      activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                    >
                      Criar conta
                    </Link>
                  </>
                )}

                {sessao?.tipoPerfil === "ADOTANTE" && (
                  <>
                    <Link
                      to="/meu-perfil"
                      onClick={closeMobileMenu}
                      className={mobileLinkClass}
                      activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                    >
                      Meu perfil
                    </Link>
                    <Link
                      to="/triagem"
                      onClick={closeMobileMenu}
                      className={mobileLinkClass}
                      activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                    >
                      Minha triagem
                    </Link>
                    <Link
                      to="/minhas-solicitacoes"
                      onClick={closeMobileMenu}
                      className={mobileLinkClass}
                      activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                    >
                      Minhas solicitações
                    </Link>
                    <Link
                      to="/mensagens"
                      onClick={closeMobileMenu}
                      className={mobileLinkClass}
                      activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                    >
                      <span>Mensagens</span>
                      {unread > 0 && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          <span className="sr-only">Mensagens não lidas: </span>
                          {unread}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/meus-favoritos"
                      onClick={closeMobileMenu}
                      className={mobileLinkClass}
                      activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                    >
                      Meus favoritos
                    </Link>
                  </>
                )}

                {isResponsible && (
                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className={mobileLinkClass}
                    activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                  >
                    Meu painel
                  </Link>
                )}

                {sessao?.tipoPerfil === "ADMIN" && (
                  <Link
                    to="/dashboard/admin/usuarios"
                    onClick={closeMobileMenu}
                    className={mobileLinkClass}
                    activeProps={{ className: activeMobileLink, "aria-current": "page" }}
                  >
                    Administração
                  </Link>
                )}
              </nav>

              {sessao && (
                <div className="border-t border-border px-4 py-4">
                  <p className="mb-3 truncate px-3 text-xs text-muted-foreground">{sessao.email}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={doLogout}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sair
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
