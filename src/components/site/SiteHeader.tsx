import { Link } from "@tanstack/react-router";
import { Menu, Moon, Search, Sun } from "lucide-react";

const home = "/";
// A page of the documentation, which the router reaches through /$.
const overview: string = "/overview.html";
const library = "/books.html";

export function Logo() {
  return (
    <Link to={home} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-6 place-items-center rounded-md bg-primary font-mono text-xs text-primary-foreground">
        S
      </span>
      <span>Syg</span>
    </Link>
  );
}

function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("syg-theme", dark ? "dark" : "light");
  } catch {
    /* storage unavailable: the choice lasts this page only */
  }
}

const navLink = "rounded-md px-2.5 py-1.5 transition-colors hover:text-foreground";
const navClass = (on: boolean) =>
  `${navLink} ${on ? "font-medium text-foreground" : "text-muted-foreground"}`;

export function SiteHeader({
  onMenu,
  onSearch,
  current,
}: {
  onMenu?: () => void;
  onSearch?: () => void;
  current?: "docs";
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
        {onMenu && (
          <button
            onClick={onMenu}
            className="-ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
        )}
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 text-sm sm:flex">
          <Link to={overview} className={navClass(current === "docs")}>
            Docs
          </Link>
          <Link to={library} className={navClass(false)}>
            Books
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          {onSearch && (
            <button
              onClick={onSearch}
              className="flex h-8 items-center gap-2 rounded-md border bg-muted/50 px-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:w-56"
              aria-label="Search documentation"
            >
              <Search className="size-4" />
              <span className="hidden sm:inline">Search docs…</span>
              <kbd className="ml-auto hidden rounded border bg-background px-1.5 font-mono text-[10px] sm:inline">
                ⌘K
              </kbd>
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle dark mode"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </button>
        </div>
      </div>
    </header>
  );
}
