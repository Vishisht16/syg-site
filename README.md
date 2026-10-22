# syg-site

The website at [syg.vishisht.tech](https://syg.vishisht.tech): Syg's
documentation and the Syg Engineering Notes.

The content is not kept here. Each build reads it from Syg's repository,
[Vishisht16/Syg](https://github.com/Vishisht16/Syg): the Markdown and the
schemas in `docs/`, which every Syg release and docs publish commits there,
and the install scripts at its root. This repository is the site around them:
a [TanStack Start](https://tanstack.com/start) app, prerendered to static
files for GitHub Pages.

## Addresses

Every page keeps the address the binary, the installers and existing links
use. A page is at its Markdown path with `.html` for `.md`:

| Content                                        | Address                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `docs/install.md`                              | `/install.html`, also served at `/install`                                |
| `docs/rules/availability.md`                   | `/rules/availability.html`, each rule a section: `#single-replica-budget` |
| `docs/rules/index.md`                          | `/rules/index.html`, also `/rules/`                                       |
| `docs/topics/qos.md`                           | `/topics/qos.html`                                                        |
| `docs/notes/05-containers.md`                  | `/notes/05-containers.html`                                               |
| `docs/index.md`, the overview                  | `/overview.html`                                                          |
| `docs/schemas/**`, `install.sh`, `install.ps1` | the same paths, as they are                                               |

`/` is the landing page, `/books.html` the library of the Engineering Notes,
and `/.well-known/security.txt` is written at each build, with `/build.json`,
which names the commit of Syg the site was built from. Headings keep the ids
they had, so a link to a section still lands on it.

## Working on it

With [Bun](https://bun.sh) 1.4 and Node.js 22:

```console
$ bun install
$ bun run dev                 # from a clone of Syg it makes in .syg
$ SYG_DIR=../Syg bun run dev  # from a checkout of Syg you have
```

`bun run content` writes `src/generated/` from Syg's docs (the navigation,
the search index and each page, rendered at build time). `bun run build`
does that, prerenders every page to `dist/client`, and checks the result;
`bun run serve` serves it the way GitHub Pages does. Before a change:
`bun run typecheck`, `bun run lint` and `bun run test`.

The navigation follows Syg's own site generator: a new page in Syg's docs
gets its section in `AUTHORED` in `scripts/content.ts` (until then the build
lists it under Project and warns).

## Publishing

[`deploy.yml`](.github/workflows/deploy.yml) builds and publishes the site on
a push to `main`, when Syg publishes its docs (Syg dispatches it with the
commit), daily, and by hand with any branch, tag or commit of Syg. After each
deploy, `scripts/check-site.sh` checks that what the domain serves is what
was built: every file byte for byte, every rule's section, and the addresses
the binary prints.

## Licence

The site's code is MIT; the documentation it publishes is Syg's, under the
Syg EULA. See [LICENSE](LICENSE).
