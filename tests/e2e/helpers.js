/**
 * Wait for the React app to be ready
 */
export async function waitForAppReady(page) {
  // Wait for React to render #app container
  await page.waitForSelector('#app', { timeout: 10000 });

  // Give service worker time to register (if enabled)
  await page.waitForTimeout(500);

  return true;
}

/**
 * Set up error tracking for console and page errors
 */
export function setupErrorTracking(page) {
  const errors = {
    console: [],
    unhandled: []
  };

  // Track console errors and warnings
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.console.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  // Track unhandled promise rejections and exceptions
  page.on('pageerror', error => {
    errors.unhandled.push({
      message: error.message,
      stack: error.stack
    });
  });

  return errors;
}
