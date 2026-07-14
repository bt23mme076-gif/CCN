const BASE = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries';
const IN = `${BASE}/india`;
const UK = `${BASE}/united-kingdom`;
const US = `${BASE}/united-states`;
const INT = `${BASE}/international`;

const logos: Record<string, string> = {
  // ── English Entertainment ──────────────────────────────────────────────
  'Colors Infinity':       `${IN}/colors-infinity-in.png`,
  'Colors Infinity HD':    `${IN}/colors-infinity-hd-in.png`,
  'Disney International HD': `${US}/disney-channel-us.png`,
  'Zee Café':              `${IN}/zee-cafe-in.png`,
  'Zee Café HD':           `${IN}/zee-cafe-hd-in.png`,

  // ── English Movies ─────────────────────────────────────────────────────
  '&flix':                 `${IN}/and-flix-in.png`,
  '&flix HD':              `${IN}/and-flix-hd-in.png`,
  '&prive HD':             `${IN}/and-prive-hd-in.png`,
  'MN+ HD':                `${IN}/mn-plus-hd-in.png`,
  'MNX':                   `${IN}/mnx-in.png`,
  'MNX HD':                `${IN}/mnx-hd-in.png`,
  'Movies Now':            `${IN}/movies-now-in.png`,
  'Movies Now HD':         `${IN}/movies-now-hd-in.png`,
  'Romedy Now':            `${IN}/romedy-now-in.png`,
  'Sony Pix':              `${IN}/sony-pix-in.png`,
  'Sony Pix HD':           `${IN}/sony-pix-hd-in.png`,
  'Star Movies':           `${IN}/star-movies-in.png`,
  'Star Movies HD':        `${IN}/star-movies-hd-in.png`,

  // ── English News ───────────────────────────────────────────────────────
  'BBC News':              `${INT}/bbc-world-news-int.png`,
  'CNBC TV18':             `${IN}/cnbc-tv18-in.png`,
  'CNBC TV18 Prime HD':    `${IN}/cnbc-tv18-prime-hd-in.png`,
  'CNN':                   `${INT}/cnn-international-int.png`,
  'CNN News18':            `${IN}/cnn-news-18-in.png`,
  'ET Now':                `${IN}/et-now-in.png`,
  'India Today':           `${IN}/india-today-in.png`,
  'Mirror Now':            `${IN}/mirror-now-in.png`,
  'NDTV 24x7':             `${IN}/ndtv-24x7-in.png`,
  'NDTV Profit Prime':     `${IN}/ndtv-profit-in.png`,
  'Times Now':             `${IN}/times-now-in.png`,
  'WION':                  `${IN}/wion-in.png`,

  // ── Hindi Entertainment ────────────────────────────────────────────────
  '&TV':                               `${IN}/and-tv-in.png`,
  '&TV HD':                            `${IN}/and-tv-hd-in.png`,
  'Colors':                            `${IN}/colors-in.png`,
  'Colors HD':                         `${IN}/colors-hd-in.png`,
  'Investigation Discovery':           `${INT}/investigation-discovery-int.png`,
  'Investigation Discovery HD':        `${INT}/investigation-discovery-int.png`,
  'Sony Entertainment Television':     `${IN}/sony-entertainment-television-in.png`,
  'Sony Entertainment Television HD':  `${IN}/sony-entertainment-television-hd-in.png`,
  'Sony SAB':                          `${IN}/sony-sab-in.png`,
  'Sony SAB HD':                       `${IN}/sony-sab-hd-in.png`,
  'Star Bharat':                       `${IN}/star-bharat-in.png`,
  'Star Bharat HD':                    `${IN}/star-bharat-hd-in.png`,
  'Star Plus':                         `${IN}/star-plus-in.png`,
  'Star Plus HD':                      `${IN}/star-plus-hd-in.png`,
  'Zee TV':                            `${IN}/zee-tv-in.png`,
  'Zee TV HD':                         `${IN}/zee-tv-hd-in.png`,

  // ── Hindi Movies ───────────────────────────────────────────────────────
  '&pictures':             `${IN}/and-pictures-in.png`,
  '&pictures HD':          `${IN}/and-pictures-hd-in.png`,
  // &Xplor HD — not in tv-logos repo, falls back to initials
  'Colors Cineplex':       `${IN}/colors-cineplex-in.png`,
  'Colors Cineplex HD':    `${IN}/colors-cineplex-hd-in.png`,
  'Sony Max':              `${IN}/sony-max-in.png`,
  'Sony Max 1':            `${IN}/sony-max-in.png`,
  'Sony Max 2':            `${IN}/sony-max-2-in.png`,
  'Sony Max HD':           `${IN}/sony-max-hd-in.png`,
  'Star Gold':             `${IN}/star-gold-in.png`,
  'Star Gold 2':           `${IN}/star-gold-2-in.png`,
  // Star Gold 2 HD not in repo — fall back to initials
  'Star Gold HD':          `${IN}/star-gold-hd-in.png`,
  'Star Gold Select':      `${IN}/star-gold-select-in.png`,
  'Star Gold Select HD':   `${IN}/star-gold-select-hd-in.png`,
  'Zee Bollywood':         `${IN}/zee-bollywood-in.png`,
  'Zee Cinema':            `${IN}/zee-cinema-in.png`,
  'Zee Cinema HD':         `${IN}/zee-cinema-hd-in.png`,
  'Zee Classic':           `${IN}/zee-classic-in.png`,

  // ── Hindi News ─────────────────────────────────────────────────────────
  'Aaj Tak HD':            `${IN}/aaj-tak-hd-in.png`,
  'CNBC Awaaz':            `${IN}/cnbc-awaaz-in.png`,
  'ET Now Swadesh':        `${IN}/et-now-swadesh-in.png`,
  'India TV Speed News HD':`${IN}/india-tv-in.png`,
  'Zee Bharat':            `${IN}/zee-bharat-in.png`,
  'Zee Business':          `${IN}/zee-business-in.png`,
  'Zee News HD':           `${IN}/zee-news-hd-in.png`,

  // ── Hindi Regional ─────────────────────────────────────────────────────
  // News18 regional variants not in tv-logos repo — fall back to initials
  'Salaam TV':                           `${IN}/salaam-tv-in.png`,
  'Zee Bihar Jharkhand':                 `${IN}/zee-bihar-jharkhand-in.png`,
  'Zee Rajasthan News':                  `${IN}/zee-rajasthan-in.png`,
  'Zee Uttar Pradesh Uttarakhand':       `${IN}/zee-uttar-pradesh-uttarakhand-in.png`,
};

export function getChannelLogo(name: string): string | null {
  return logos[name] ?? null;
}

export function getChannelColor(name: string): string {
  const palette = [
    '#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316',
    '#10b981','#0ea5e9','#14b8a6','#a855f7','#e11d48',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
