'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if dark mode is enabled on initial load
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
    setIsDarkMode(!isDarkMode);
  };

  // Handle navigation
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (path === '/') {
      // Clear resume data from localStorage when navigating home
      localStorage.removeItem("resume");
    }
    router.push(path);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white dark:bg-gray-800 shadow-md backdrop-blur-lg bg-opacity-90 dark:bg-opacity-90' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a 
            href="/"
            onClick={(e) => handleNavigation(e, '/')}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <div className="h-8 w-8 text-blue-violet-600 dark:text-blue-violet-400">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L3 9L12 14L21 9L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 14L12 19L21 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">IIIT Bhopal Resume Analyzer</span>
          </a>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <a
              href="/"
              onClick={(e) => handleNavigation(e, '/')}
              className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                pathname === '/' 
                  ? 'text-blue-violet-600 dark:text-blue-violet-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-violet-600 dark:hover:text-blue-violet-400'
              }`}
            >
              Home
            </a>

            <Link 
              href="/user-reference" 
              className={`text-sm font-medium transition-colors duration-200 ${
                pathname === '/user-reference' 
                  ? 'text-blue-violet-600 dark:text-blue-violet-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-violet-600 dark:hover:text-blue-violet-400'
              }`}
            >
              User Reference
            </Link>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}; 