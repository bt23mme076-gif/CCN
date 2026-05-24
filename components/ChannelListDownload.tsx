'use client';

import { useTranslation } from '@/lib/useTranslation';

interface ChannelListDownloadProps {
  planName: string;
  price: number;
}

export default function ChannelListDownload({ planName, price }: ChannelListDownloadProps) {
  const { language } = useTranslation();

  const getCSVFileName = () => {
    if (price === 19900) {
      return '/channels-base-pack-199.csv';
    } else if (price === 29900) {
      return '/channels-all-in-one-299.csv';
    } else if (price === 34900) {
      return '/channels-royal-hd-349.csv';
    }
    return null;
  };

  const csvFile = getCSVFileName();

  if (!csvFile) {
    return null;
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = csvFile;
    link.download = csvFile.split('/').pop() || 'channels.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      title={language === 'hi' ? 'चैनल सूची डाउनलोड करें' : 'Download Channel List'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {language === 'hi' ? 'चैनल सूची डाउनलोड करें' : 'Download Channel List'}
    </button>
  );
}
