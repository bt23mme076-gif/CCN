export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startPendingActivationReminder } = await import('./lib/pendingReminder');
    startPendingActivationReminder();
  }
}
