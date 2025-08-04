import { useEffect, useState } from 'react';

const COOKIE_NAME = 'mezon_cookie_consent';

const setCookie = (name: string, value: string, days = 365) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

export default function CustomCookieConsent() {
  const [visible, setVisible] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);
  const [statisticsChecked, setStatisticsChecked] = useState(false);


  useEffect(() => {
    const hasConsent = document.cookie
      .split('; ')
      .find((row) => row.startsWith(COOKIE_NAME + '='));
    if (!hasConsent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setCookie(COOKIE_NAME, 'accepted');
    setVisible(false);
  };

  const handleReject = () => {
    setCookie(COOKIE_NAME, 'rejected');
    setVisible(false);
  };

  const handleSettings = () => {
    setOpenSettings(true);
  };

  const handleBack = () => {
    setOpenSettings(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed left-6 bottom-6 z-[9999] bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm w-[calc(100vw-48px)] text-[15px] flex flex-col gap-4">
      {openSettings ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleBack}
              className="text-indigo-500 hover:text-indigo-600 font-bold text-lg px-2"
              aria-label="Back"
            >
              &#8592;
            </button>
            <span className="font-semibold text-lg">Cookies settings</span>
          </div>
          <div className="text-gray-700 mb-2">
            Please choose your settings for this site below. You can allow or deny non essential cookies.
          </div>
          <div className="border-b border-gray-200 py-3">
            <div className="font-semibold text-[15px]">Essential</div>
            <div className="text-[14px] text-gray-600">
              Please see the list of essential cookies in our{' '}
              <a href="/privacy" className="text-indigo-500 underline hover:text-indigo-600 font-medium">
                Cookie Policy
              </a>
            </div>
            <div className="flex items-center mt-2">
              <span className="text-[13px] text-gray-500 mr-2">Always active</span>
              <input type="checkbox" checked disabled className="accent-indigo-500" />
            </div>
          </div>
          <div className="border-b border-gray-200 py-3">
            <div className="font-semibold text-[15px]">Marketing/Tracking</div>
            <div className="text-[14px] text-gray-600">
              Please see the list of marketing/tracking cookies in our{' '}
              <a href="/privacy" className="text-indigo-500 underline hover:text-indigo-600 font-medium">
                Cookie Policy
              </a>
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={marketingChecked}
                onChange={() => setMarketingChecked((v) => !v)}
                className={`peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
                  bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
                  after:bg-slate-500 after:transition-all
                  checked:bg-[#5265EC] checked:after:left-4 checked:after:bg-white
                  hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-[#4654C0] checked:after:hover:bg-white
                  focus:outline-none focus-visible:outline-none
                `}
              />
            </div>
          </div>
          <div className="py-3">
            <div className="font-semibold text-[15px]">Statistics</div>
            <div className="text-[14px] text-gray-600">
              Please see the list of statistics cookies in our{' '}
              <a href="/privacy" className="text-indigo-500 underline hover:text-indigo-600 font-medium">
                Cookie Policy
              </a>
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={statisticsChecked}
                onChange={() => setStatisticsChecked((v) => !v)}
                className={`peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
                  bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
                  after:bg-slate-500 after:transition-all
                  checked:bg-[#5265EC] checked:after:left-4 checked:after:bg-white
                  hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-[#4654C0] checked:after:hover:bg-white
                  focus:outline-none focus-visible:outline-none
                `}
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={handleReject}
              className="w-full max-w-[200px] bg-white text-indigo-500 border border-indigo-500 rounded-full px-4 py-2 font-semibold text-[15px] hover:bg-orange-50 transition"
            >
              Reject all
            </button>
            <button
              onClick={handleAccept}
              className="w-full max-w-[200px] bg-indigo-500 text-white border-none rounded-full px-4 py-2 font-semibold text-[15px] shadow hover:bg-indigo-600 transition"
            >
              Save settings
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="font-semibold mb-1 text-[20px]">Cookies</div>
          <div className="leading-relaxed">
            We use cookies to provide a better experience. Click{' '}
            <b>Accept all</b> to agree to the storing of all cookies, or{' '}
            <button
              type="button"
              className="text-indigo-500 underline hover:text-indigo-600 font-medium"
              onClick={handleSettings}
            >
              Settings
            </button>
            {' '}to manage your preferences. If you choose <b>Reject all</b>, we will only use necessary cookies. To learn more, please read our{' '}
            <a
              href="/privacy"
              className="text-indigo-500 underline hover:text-indigo-600 font-medium"
            >
              Cookie Policy
            </a>.
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={handleReject}
              className="w-full max-w-[200px] bg-white text-indigo-500 border border-indigo-500 rounded-full px-4 py-2 font-semibold text-[15px] hover:bg-orange-50 transition"
            >
              Reject all
            </button>
            <button
              onClick={handleAccept}
              className="w-full max-w-[200px] bg-indigo-500 text-white border-none rounded-full px-4 py-2 font-semibold text-[15px] shadow hover:bg-indigo-600 transition"
            >
              Accept all
            </button>
          </div>
        </>
      )}
    </div>
  );
}
