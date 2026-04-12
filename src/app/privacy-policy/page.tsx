'use client';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Introduction</h2>
          <p className="text-gray-600 dark:text-gray-300">
            IIIT Bhopal Resume Analyzer ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our career guidance platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Information We Collect</h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>Resume data and professional information you provide</li>
            <li>Usage data and analytics</li>
            <li>Device and browser information</li>
            <li>Cookies and tracking technologies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>To provide career guidance and placement predictions</li>
            <li>To improve our services and user experience</li>
            <li>To communicate with you about our services</li>
            <li>To ensure the security of our platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Data Security</h2>
          <p className="text-gray-600 dark:text-gray-300">
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Contact Us</h2>
          <p className="text-gray-600 dark:text-gray-300">
            If you have any questions about this Privacy Policy, please contact us at privacy@iiitbhopalresumeanalyzer.com
          </p>
        </section>
      </div>
    </div>
  );
} 