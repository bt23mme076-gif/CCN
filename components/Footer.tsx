import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-navy text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-display text-xl font-bold mb-2">CableEasy</h3>
            <p className="text-gray-300 text-sm">
              Recharge your cable connection online with instant activation
            </p>
          </div>
          <Link
            href="/admin/login"
            className="text-gray-300 hover:text-white transition-colors text-sm"
          >
            Operator Login
          </Link>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} CableEasy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
