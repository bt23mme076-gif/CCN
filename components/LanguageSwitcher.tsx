'use client';

import { useState, useEffect } from 'react';
import { Language } from '@/lib/translations';

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState<Language>('en');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if user has already selected a language
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguage(savedLang);
      document.documentElement.lang = savedLang;
    } else {
      // Show popup for first-time users
      setShowPopup(true);
    }
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    setShowPopup(false);
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
    // Reload to apply translations
    window.location.reload();
  };

  return (
    <>
      {/* Language Toggle Button */}
      <button
        onClick={() => setShowPopup(true)}
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm sm:text-base"
        aria-label="Change Language"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="font-medium hidden sm:inline">{language === 'en' ? 'English' : 'हिंदी'}</span>
        <span className="font-medium sm:hidden">{language === 'en' ? 'EN' : 'हिं'}</span>
      </button>

      {/* Language Selection Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Choose Your Language
              </h2>
              <p className="text-gray-600 mb-1 text-sm sm:text-base">अपनी भाषा चुनें</p>
              <p className="text-xs sm:text-sm text-gray-500">Select your preferred language</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  language === 'en'
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🇬🇧</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">English</div>
                      <div className="text-xs sm:text-sm text-gray-600">Continue in English</div>
                    </div>
                  </div>
                  {language === 'en' && (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>

              <button
                onClick={() => handleLanguageChange('hi')}
                className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  language === 'hi'
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🇮🇳</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">हिंदी</div>
                      <div className="text-xs sm:text-sm text-gray-600">हिंदी में जारी रखें</div>
                    </div>
                  </div>
                  {language === 'hi' && (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4 sm:mt-6">
              You can change this anytime from the navigation bar
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
