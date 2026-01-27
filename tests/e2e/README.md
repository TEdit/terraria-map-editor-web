# End-to-End Tests

## Overview

E2E tests verify that the Terraria Map Editor web app loads and runs without runtime errors.

## Running Tests

**Locally:**
```bash
# Run all tests (headless)
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug
```

**CI/CD:**
Tests run automatically in GitHub Actions before deployment. Deployment is blocked if tests fail.

## What's Tested

- Page loads without console errors or warnings
- React app renders successfully
- Canvas element is present
- No unhandled promise rejections

## Adding New Tests

1. Create new test file in `tests/e2e/`
2. Use `smoke.spec.js` as template
3. Import helpers from `helpers.js`
4. Follow naming convention: `*.spec.js`

## Debugging Failed Tests

When tests fail in CI:
1. Check GitHub Actions artifacts for `playwright-report`
2. Download and open `index.html` in browser
3. Review screenshots and traces
4. Reproduce locally with `npm run test:e2e:headed`

## Configuration

See `playwright.config.js` at project root for:
- Browser settings
- Timeout configuration
- Reporter options
- WebServer setup
