// Suppress browser extension errors in development
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    // Suppress known extension-related errors
    const errorString = args.join(' ');
    if (
      errorString.includes('runtime.lastError') ||
      errorString.includes('message port closed') ||
      errorString.includes('Extension context invalidated')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}
