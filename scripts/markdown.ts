// Renders one page of Syg's Markdown to the HTML the site shows, at build time:
// the browser never loads a Markdown parser. Headings get the ids the site
// this one replaced gave them, so a link to a section keeps working; links to
// other pages go to their URLs here.
import { Marked, type Token, type Tokens } from "marked";
import type { Heading } from "../src/lib/site";

export type Section = { id: string; title: string; text: string };

export type Rendered = {
  html: string;
  headings: Heading[];
  words: number;
  /** The text before the first second-level heading, for search. */
  lead: string;
  /** Each second-level section, for search. */
  sections: Section[];
};

/**
 * Resolves a link's destination, as written in the page's Markdown, to the
 * URL it has on the site, or null when it names nothing the site publishes:
 * such a link keeps only its text, as it did before.
 */
export type Resolve = (href: string) => string | null;

/**
 * headingIds returns goldmark's automatic heading id, which the previous site
 * used, for each heading of one document in turn: from the heading's source,
 * ASCII letters and digits lowercased, spaces, '-' and '_' as '-', anything
 * else dropped, and "-1", "-2" for a repeat. A link in a heading counts by its
 * text only (goldmark also counted its destination, giving ids nothing links
 * to).
 */
export function headingIds(): (source: string) => string {
  const seen = new Set<string>();
  return (source) => {
    const value = source.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
    let id = "";
    for (const ch of value) {
      if (ch.length !== 1 || ch.charCodeAt(0) > 0x7f) continue;
      if (/[A-Za-z0-9]/.test(ch)) id += ch.toLowerCase();
      else if (/[ \t\n\v\f\r_-]/.test(ch)) id += "-";
    }
    if (id === "") id = "heading";
    let out = id;
    for (let n = 1; seen.has(out); n++) out = `${id}-${n}`;
    seen.add(out);
    return out;
  };
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The text of rendered inline HTML: its tags dropped, its entities decoded. */
export function textOf(html: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, e: string) =>
      e[0] === "#"
        ? String.fromCodePoint(
            e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10),
          )
        : (named[e.toLowerCase()] ?? m),
    );
}

const LABELS: Record<string, string> = {
  syg: "Syg",
  "syg-fragment": "Syg",
  "syg-fail": "Syg",
  yaml: "YAML",
  yml: "YAML",
  json: "JSON",
  toml: "TOML",
  ebnf: "EBNF",
  lua: "Lua",
  go: "Go",
  sh: "Shell",
  bash: "Shell",
  shell: "Shell",
  console: "Console",
  powershell: "PowerShell",
  text: "Text",
  txt: "Text",
};
const label = (lang: string) =>
  lang ? (LABELS[lang.toLowerCase()] ?? lang[0]!.toUpperCase() + lang.slice(1)) : "Text";

// The words that begin Syg's declarations and fields, which a reader scans for.
const SYG_WORDS = new Set(
  (
    "module import service job stateful workload extern relate raw profile use environment " +
    "config secret identity image replicas port needs expose health ready live startup " +
    "resources cpu memory limits disruption scale schedule storage scratch security rollout " +
    "spread avoid tolerate labels annotations internal at tls as via with on qos namespace " +
    "command args env policy ingress egress"
  ).split(" "),
);
const COMMANDS = new Set(
  (
    "syg kubectl helm go brew curl git scoop docker cosign gh irm tar sha256sum shasum " +
    "install make kind argocd flux jq xattr"
  ).split(" "),
);

const span = (cls: string, s: string) => `<span class="${cls}">${esc(s)}</span>`;

/** Strings, numbers and comments, and the words isWord marks as keywords. */
function words(code: string, comment: RegExp, isWord: (w: string) => boolean): string {
  const re = new RegExp(
    `(${comment.source})|("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*')|(\\b\\d+(?:\\.\\d+)?[a-zA-Z%]*\\b)|([A-Za-z_][\\w-]*)`,
    "g",
  );
  let out = "";
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1]) {
      // '#' starts a comment only at the start of a line or after a space.
      const prev = code[m.index - 1];
      out += m[1][0] === "#" && prev && !/\s/.test(prev) ? esc(m[0]) : span("tk-c", m[0]);
    } else if (m[2]) out += span("tk-s", m[0]);
    else if (m[3]) out += span("tk-n", m[0]);
    else if (m[4] && isWord(m[4])) out += span("tk-k", m[0]);
    else out += esc(m[0]);
  }
  return out + esc(code.slice(last));
}

/** A terminal session: each prompt and the command it runs marked, the output left plain. */
function session(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      const m = /^(\$|>|PS>|PS [^>]*>) (\S+)(.*)$/.exec(line);
      if (!m) return esc(line);
      const cmd = COMMANDS.has(m[2]!) ? span("tk-k", m[2]!) : esc(m[2]!);
      return span("tk-c", m[1]!) + " " + cmd + esc(m[3]!);
    })
    .join("\n");
}

/** highlight marks up a code block for the site's stylesheet, by its language. */
export function highlight(code: string, lang: string): string {
  const l = lang.toLowerCase();
  if (l.startsWith("syg")) return words(code, /#[^\n]*/, (w) => SYG_WORDS.has(w));
  if (l === "yaml" || l === "yml") {
    return code
      .split("\n")
      .map((line) => {
        const m = /^(\s*(?:- )?)([\w./-]+)(:)(\s.*|)$/.exec(line);
        if (!m) return words(line, /#[^\n]*/, () => false);
        return esc(m[1]!) + span("tk-k", m[2]!) + esc(m[3]!) + words(m[4]!, /#[^\n]*/, () => false);
      })
      .join("\n");
  }
  if (["console", "sh", "bash", "shell", "powershell"].includes(l)) return session(code);
  if (l === "toml") return words(code, /#[^\n]*/, () => false);
  if (l === "json")
    return words(code, /\/\/[^\n]*/, (w) => w === "true" || w === "false" || w === "null");
  return esc(code);
}

/** Markdown reduced to its words, for search. */
export function plain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Parser = { parser: { parseInline(tokens: Token[]): string } };

/**
 * render renders a page. resolve maps each link; chapter, for a page of the
 * Engineering Notes, drops the "Chapter N: " from its title, which the reader
 * shows on its own.
 */
export function render(md: string, resolve: Resolve, opts: { chapter?: boolean } = {}): Rendered {
  const marked = new Marked({ gfm: true });
  const tokens = marked.lexer(md);
  const nextId = headingIds();
  const ids = new Map<Token, string>();
  marked.walkTokens(tokens, (t) => {
    if (t.type === "heading") ids.set(t, nextId((t as Tokens.Heading).text));
  });

  const sections: Section[] = [];
  let lead = "";
  for (const t of tokens) {
    if (t.type === "heading") {
      const h = t as Tokens.Heading;
      if (h.depth === 2) sections.push({ id: ids.get(t)!, title: plain(h.text), text: "" });
      else if (h.depth > 2 && sections.length)
        sections[sections.length - 1]!.text += " " + plain(h.text);
      continue;
    }
    const text = plain(t.raw);
    if (sections.length) sections[sections.length - 1]!.text += " " + text;
    else lead += " " + text;
  }

  const headings: Heading[] = [];
  let first = true;
  marked.use({
    renderer: {
      heading(this: Parser, token: Tokens.Heading) {
        const id = ids.get(token) ?? nextId(token.text);
        const inner = this.parser.parseInline(token.tokens);
        if (token.depth === 1 && first) {
          first = false;
          const title = opts.chapter ? inner.replace(/^Chapter \d+:\s*/, "") : inner;
          return `<h1 class="page-title" id="${id}">${title}</h1>\n`;
        }
        if (token.depth <= 3) headings.push({ id, text: textOf(inner), depth: token.depth });
        return `<h${token.depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${token.depth}>\n`;
      },
      link(this: Parser, { href, title, tokens: inner }: Tokens.Link) {
        const text = this.parser.parseInline(inner);
        const url = resolve(href);
        if (url === null) return text;
        const external = /^(https?:|mailto:)/.test(url);
        const attrs =
          (title ? ` title="${esc(title)}"` : "") +
          (external ? ' target="_blank" rel="noopener"' : "");
        return `<a href="${esc(url)}"${attrs}>${text}</a>`;
      },
      code({ text, lang }: Tokens.Code) {
        const l = (lang ?? "").split(/\s/)[0] ?? "";
        if (l === "mermaid")
          return `<figure class="mermaid-block"><pre class="mermaid-src" hidden>${esc(text)}</pre><div class="mermaid-view" role="img" aria-label="Diagram"></div></figure>\n`;
        return `<div class="code-block" data-lang="${esc(l)}"><div class="code-head"><span class="code-lang">${esc(label(l))}</span><button class="code-copy" type="button" aria-label="Copy code">Copy</button></div><pre><code>${highlight(text, l)}</code></pre></div>\n`;
      },
      table(this: Parser, token: Tokens.Table) {
        const cell = (tag: string, c: Tokens.TableCell) =>
          `<${tag}${c.align ? ` style="text-align:${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</${tag}>`;
        const head = token.header.map((c) => cell("th", c)).join("");
        const body = token.rows
          .map((r) => `<tr>${r.map((c) => cell("td", c)).join("")}</tr>`)
          .join("");
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>\n`;
      },
    },
  });
  const html = marked.parser(tokens);
  for (const s of sections) s.text = s.text.replace(/\s+/g, " ").trim();
  return {
    html,
    headings,
    words: md.split(/\s+/).filter(Boolean).length,
    lead: lead.replace(/\s+/g, " ").trim(),
    sections,
  };
}
