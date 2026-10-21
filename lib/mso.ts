// Which MSO (cable distribution platform) a set-top box belongs to.
// GTPL STB numbers start with "3"; every other STB is on NXTDIGITAL.
// (Same rule the activation screen already uses for its GTPL rescan tip.)
export const MSOS = [
  { id: 'gtpl', name: 'GTPL' },
  { id: 'nxt', name: 'NXTDIGITAL' },
] as const;

export type MsoId = (typeof MSOS)[number]['id'];

export function msoForStb(stbNumber: string | null | undefined): MsoId {
  return (stbNumber ?? '').trim().startsWith('3') ? 'gtpl' : 'nxt';
}

export function msoName(id: MsoId): string {
  return MSOS.find((m) => m.id === id)?.name ?? id;
}
