'use client';

import { useRouter } from 'next/navigation';

export const Footer = () => {
  const router = useRouter();

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (path === '/') {
      localStorage.removeItem("resume");
    }
    router.push(path);
  };

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center">
          {/* Logo Section */}
          <a
            href="/"
            onClick={(e) => handleNavigation(e, '/')}
            className="flex items-center space-x-2 mb-8 cursor-pointer"
          >
            <div className="h-8 w-8 text-blue-violet-600 dark:text-blue-violet-400">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L3 9L12 14L21 9L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 14L12 19L21 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">IIIT Bhopal Resume Analyzer</span>
          </a>

          {/* Description */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            Your AI-powered career guidance platform
          </p>

          {/* Subtext */}
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
            Unlock your potential with personalized job matches and placement predictions
          </p>

          {/* Copyright */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} IIIT Bhopal Resume Analyzer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}; 