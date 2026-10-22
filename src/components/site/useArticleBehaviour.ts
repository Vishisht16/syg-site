import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { isPagePath } from "@/lib/site";

/**
 * Delegated click handling for rendered Markdown: a link to another page is
 * followed in the app, a link to a file (install.sh, a schema) by the
 * browser, and a code block's button copies it.
 */
export function useArticleClick() {
  const navigate = useNavigate();
  return useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      const copy = target.closest<HTMLButtonElement>(".code-copy");
      if (copy) {
        const code = copy.closest(".code-block")?.querySelector("code")?.textContent ?? "";
        navigator.clipboard?.writeText(code);
        copy.textContent = "Copied";
        copy.dataset["copied"] = "";
        setTimeout(() => {
          copy.textContent = "Copy";
          delete copy.dataset["copied"];
        }, 1400);
        return;
      }
      const a = target.closest<HTMLAnchorElement>("a");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("/") && isPagePath(href.split(/[?#]/)[0] ?? "")) {
        e.preventDefault();
        navigate({ href });
      }
    },
    [navigate],
  );
}
