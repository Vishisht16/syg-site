import { useEffect, type RefObject } from "react";

let counter = 0;
let mermaidPromise: Promise<typeof import("mermaid")> | null = null;
const loadMermaid = () => (mermaidPromise ??= import("mermaid"));

let canvasCtx: CanvasRenderingContext2D | null = null;
/** Mermaid's colour library reads hex and rgb only, so oklch and the rest go through a canvas. */
const toRgb = (color: string | undefined, fallback: string) => {
  if (!color) return fallback;
  canvasCtx ??= document.createElement("canvas").getContext("2d");
  if (!canvasCtx) return fallback;
  canvasCtx.fillStyle = "#000";
  canvasCtx.fillStyle = color;
  return /^#|^rgb/.test(canvasCtx.fillStyle) ? canvasCtx.fillStyle : fallback;
};

const cssVar = (el: Element, name: string) =>
  getComputedStyle(el).getPropertyValue(name).trim() || undefined;

function themeFor(el: Element) {
  const reader = el.closest(".reader");
  const dark = document.documentElement.classList.contains("dark");
  const scope = reader ?? el;
  const fg = toRgb(cssVar(scope, reader ? "--r-fg" : "--foreground"), "#222222");
  const bg = toRgb(cssVar(scope, reader ? "--r-bg" : "--card"), "#ffffff");
  const accent = toRgb(cssVar(scope, reader ? "--r-accent" : "--primary"), "#3b5bdb");
  const muted = toRgb(cssVar(scope, reader ? "--r-muted" : "--muted-foreground"), "#888888");
  return {
    dark,
    variables: {
      darkMode: dark,
      background: bg,
      primaryColor: bg,
      primaryTextColor: fg,
      primaryBorderColor: muted,
      lineColor: muted,
      secondaryColor: bg,
      tertiaryColor: bg,
      textColor: fg,
      mainBkg: bg,
      nodeBorder: muted,
      clusterBkg: bg,
      edgeLabelBackground: bg,
      actorBorder: muted,
      actorBkg: bg,
      signalColor: muted,
      signalTextColor: fg,
      labelTextColor: fg,
      loopTextColor: fg,
      noteBorderColor: muted,
      noteBkgColor: bg,
      noteTextColor: fg,
      activationBorderColor: accent,
      sequenceNumberColor: bg,
      fontFamily: "inherit",
    },
  };
}

function attachPanZoom(view: HTMLElement, svg: SVGSVGElement) {
  let scale = 1;
  let tx = 0;
  let ty = 0;
  const apply = () => {
    svg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };
  const fit = () => {
    const vb = svg.viewBox.baseVal;
    scale = Math.min(1, view.clientWidth / (vb.width || svg.width.baseVal.value || 1));
    tx = 0;
    ty = 0;
    if (vb.height) view.style.height = `${vb.height * scale}px`;
    apply();
  };
  fit();

  let dragging = false;
  let sx = 0;
  let sy = 0;
  view.addEventListener("pointerdown", (e) => {
    dragging = true;
    sx = e.clientX - tx;
    sy = e.clientY - ty;
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    tx = e.clientX - sx;
    ty = e.clientY - sy;
    apply();
  });
  view.addEventListener("pointerup", () => (dragging = false));
  view.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      scale = Math.min(4, Math.max(0.2, scale * (e.deltaY < 0 ? 1.1 : 0.9)));
      apply();
    },
    { passive: false },
  );

  return {
    zoom: (d: number) => {
      scale = Math.min(4, Math.max(0.2, scale * d));
      apply();
    },
    reset: fit,
  };
}

async function renderBlock(block: HTMLElement) {
  if (block.dataset["rendered"]) return;
  block.dataset["rendered"] = "1";
  const src = block.querySelector(".mermaid-src")?.textContent ?? "";
  const view = block.querySelector<HTMLElement>(".mermaid-view");
  if (!src || !view) return;
  try {
    const mermaid = (await loadMermaid()).default;
    const { dark, variables } = themeFor(block);
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "base",
      themeVariables: variables,
      flowchart: { htmlLabels: true, useMaxWidth: false },
    });
    const { svg } = await mermaid.render(`mmd-${counter++}`, src);
    view.innerHTML = svg;
    const svgEl = view.querySelector("svg");
    if (!svgEl) return;
    svgEl.style.maxWidth = "none";
    svgEl.style.height = "auto";
    const controls = attachPanZoom(view, svgEl);

    const tools = document.createElement("div");
    tools.className = "mermaid-tools";
    tools.innerHTML = `
      <button type="button" data-act="out" aria-label="Zoom out">−</button>
      <button type="button" data-act="in" aria-label="Zoom in">+</button>
      <button type="button" data-act="reset" aria-label="Reset view">Reset</button>
      <button type="button" data-act="src" aria-pressed="false">Source</button>
      <span class="mermaid-hint">drag to pan · ctrl+scroll to zoom</span>`;
    block.appendChild(tools);
    tools.addEventListener("click", (e) => {
      const act = (e.target as HTMLElement).closest("button")?.dataset["act"];
      if (act === "in") controls.zoom(1.25);
      if (act === "out") controls.zoom(0.8);
      if (act === "reset") controls.reset();
      if (act === "src") {
        const btn = tools.querySelector('[data-act="src"]')!;
        const showing = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", String(!showing));
        if (!showing) {
          const pre = document.createElement("pre");
          pre.className = "mermaid-src-view";
          pre.textContent = src;
          view.replaceChildren(pre);
        } else {
          view.innerHTML = svg;
          const again = view.querySelector("svg");
          if (again) {
            again.style.maxWidth = "none";
            again.style.height = "auto";
            attachPanZoom(view, again);
          }
        }
      }
    });
    if (dark) block.dataset["theme"] = "dark";
  } catch (err) {
    view.innerHTML = `<p class="mermaid-error">This diagram could not be rendered.</p>`;
    console.error("mermaid render failed", err);
  }
}

/**
 * Renders every .mermaid-block inside `ref` after the article HTML changes.
 * Re-runs when `deps` change (page content, reader theme) and when the site
 * dark class flips.
 */
export function useMermaid(ref: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const renderAll = () =>
      root.querySelectorAll<HTMLElement>(".mermaid-block").forEach((b) => {
        delete b.dataset["rendered"];
        void renderBlock(b);
      });
    renderAll();
    const obs = new MutationObserver(renderAll);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
