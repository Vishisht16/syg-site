// The two scripts each page runs before the app starts, inline in its head.

/** The reader's light or dark choice, or the system's. */
export const themeScript = `try{var t=localStorage.getItem("syg-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

/**
 * GitHub Pages serves /install.html at /install too, and /rules/index.html at
 * /rules/. Each page was prerendered at its .html address, which is the one
 * this site links to, so before the app starts the address is written that
 * way and the router finds the page it was given: canonicalPath in site.ts,
 * which the tests hold this to. The not-found page keeps the address typed.
 */
export const pathScript = `(function(){var l=location,p=l.pathname,n=p;if(document.querySelector('meta[name="syg-page"][content="404"]'))return;if(p==="/index.html")n="/";else if(p.slice(-1)==="/"){if(p!=="/")n=p+"index.html"}else if(!/\\.[A-Za-z0-9]+$/.test(p))n=p+".html";if(n!==p)history.replaceState(history.state,"",n+l.search+l.hash)})()`;
