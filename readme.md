<!--
  Title: terraria web editor
  Description: Terraria world file editor in browser
  Author: cokolele
  Tags: terraria, world file, file structure, file dumper, file format, documentation, data, parsing, parser, map viewer, tool, javascript, node, browser, saver, editor, save, edit
  -->

# Terraria web editor

Terraria world file editor in browser

\- supports maps from 1.3.5.3 to 1.4.4.9

See [changelog](src/changelog.json) for latest updates and version history.

Feel free to contribute 🌳

## Preview

![Image of Yaktocat](https://raw.githubusercontent.com/cokolele/terraria-web-editor/master/preview.png)

## Installation

```
\#>git clone https://github.com/TEdit/terraria-map-editor-web
\#>npm install
(if you can fix unexpected config errors yourself:
&nbsp;&nbsp;&nbsp;&nbsp;\#>npm audit fix
&nbsp;&nbsp;&nbsp;&nbsp;\#>npm update
)
\#>git submodule init
\#>git submodule update
\#>npm start
```

## Deployment

### Production Environment
- **URL:** https://www.terraria-map-editor.com
- **Source:** `master` branch
- **Platform:** GitHub Pages
- **Deployment:** Automatic on push to master
- **Workflow:** [publish-gh-pages.yaml](.github/workflows/publish-gh-pages.yaml)

### Beta Environment
- **URL:** https://beta.terraria-map-editor.com
- **Source:** Pull request branches
- **Platform:** Cloudflare Pages
- **Deployment:** Automatic when PR is opened/updated
- **Workflow:** [deploy-beta.yaml](.github/workflows/deploy-beta.yaml)
- **Note:** Shared environment - latest PR deployment overwrites previous

### Local Development
```bash
npm install
npm start          # Dev server on http://localhost:3000
npm run build      # Production build
npm run test:e2e   # Run E2E tests
```

#### [API](https://github.com/TEdit/terraria-map-editor-web-api "terraria-map-editor-api")
