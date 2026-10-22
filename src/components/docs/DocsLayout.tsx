import { Link, useLocation } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SearchDialog } from "@/components/docs/SearchDialog";
import { docs } from "@/lib/content";
import { sections } from "@/lib/site";

const library = "/books.html";

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Documentation" className="space-y-7 text-sm">
      {sections.map((sec) => {
        const items = docs.filter((d) => d.section === sec);
        if (!items.length) return null;
        return (
          <div key={sec}>
            <p className="mb-2 px-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
              {sec}
            </p>
            <ul className="space-y-px">
              {items.map((d) => (
                <li key={d.key}>
                  <Link
                    to={d.url}
                    onClick={onNavigate}
                    activeOptions={{ exact: true, includeHash: false }}
                    className="block rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    activeProps={{ className: "!bg-accent !text-accent-foreground font-medium" }}
                  >
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function DocsLayout({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" && !(e.target as HTMLElement).closest("input,textarea"))
      ) {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader onMenu={() => setMenu(true)} onSearch={() => setSearch(true)} current="docs" />
      <div className="mx-auto flex max-w-[90rem]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r px-4 py-8 lg:block">
          <SideNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/25 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setMenu(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[82%] max-w-xs overflow-y-auto border-r bg-background px-4 py-5 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="mb-6 flex items-center justify-between px-2.5">
              <span className="font-semibold">Documentation</span>
              <button
                onClick={() => setMenu(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </button>
            </div>
            <SideNav onNavigate={() => setMenu(false)} />
            <div className="mt-8 border-t px-2.5 pt-5">
              <Link to={library} className="text-sm text-primary">
                Read the Books →
              </Link>
            </div>
          </div>
        </div>
      )}
      <SearchDialog open={search} onClose={() => setSearch(false)} />
    </div>
  );
}
