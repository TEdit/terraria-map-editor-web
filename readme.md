# TEdit Web

A browser-based Terraria world file editor. Open, view, and edit your Terraria world files without installing anything.

Supports world files from Terraria 1.3.5.3 through 1.4.4.9.

See the [changelog](src/changelog.json) for version history.

## Getting Started

```bash
git clone https://github.com/TEdit/terraria-map-editor-web
git submodule init
git submodule update
npm install
npm start
```

## Development

```bash
npm start          # Dev server on http://localhost:3000
npm run build      # Production build
npm run test       # Unit tests
npm run test:e2e   # E2E tests (Playwright)
```

## Deployment

### Production
- **URL:** https://www.tedit.dev
- **Branch:** `main`
- **Platform:** GitHub Pages
- **Workflow:** [publish-gh-pages.yaml](.github/workflows/publish-gh-pages.yaml)

## License

MIT

## Acknowledgments

Originally created by [cokolele](https://github.com/cokolele) as [terraria-web-editor](https://github.com/cokolele/terraria-web-editor). This project builds on their work.
