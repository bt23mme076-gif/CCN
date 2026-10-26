'use client';

export type StreamAdType = 'l_shape' | 'full_screen';

export const AD_TYPE_LABELS: Record<StreamAdType, string> = {
  l_shape: 'L-Shape',
  full_screen: 'Full Screen',
};

// How the banner sits on the live stream. Full Screen replaces the video
// entirely; L-Shape shrinks the live video into the top-right corner, so that
// area of the banner is covered and only the left strip + bottom strip show.
// The CCN LIVE channel logo always sits in the top-right corner.
export default function StreamAdPreview({
  adType,
  banner,
  scrollText,
  className = '',
}: {
  adType: StreamAdType;
  banner?: string;
  scrollText?: string;
  className?: string;
}) {
  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black ${className}`}
      style={{ border: '6px solid #111', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <style>{`@keyframes stream-ad-ticker{from{transform:translateX(100%)}to{transform:translateX(-100%)}}`}</style>

      {banner ? (
        <img src={banner} alt="Your banner" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-center p-4"
          style={{ background: 'repeating-linear-gradient(45deg, #1f1f3a, #1f1f3a 12px, #26264a 12px, #26264a 24px)' }}>
          <span className="text-xs sm:text-sm text-blue-200/70 font-semibold">Your banner appears here</span>
        </div>
      )}

      {adType === 'l_shape' && (
        <div className="absolute top-0 right-0 flex items-center justify-center"
          style={{ width: '76%', height: '80%', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderLeft: '2px solid #f77f00', borderBottom: '2px solid #f77f00' }}>
          <div className="text-center">
            <span className="inline-block text-[10px] sm:text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white mb-1">● LIVE</span>
            <p className="text-[10px] sm:text-xs text-gray-400">Live program plays here</p>
          </div>
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ccn-live-logo.webp" alt="CCN Live" className="absolute top-[3%] right-[2%] w-[13%] pointer-events-none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }} />

      {scrollText && (
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden whitespace-nowrap py-px leading-none"
          style={{ background: '#b91c1c' }}>
          <span className="inline-block text-[9px] sm:text-[11px] font-bold text-white leading-tight"
            style={{ animation: 'stream-ad-ticker 14s linear infinite' }}>
            {scrollText}
          </span>
        </div>
      )}
    </div>
  );
}
