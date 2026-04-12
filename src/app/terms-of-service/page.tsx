'use client';

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
      
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Agreement to Terms</h2>
          <p className="text-gray-600 dark:text-gray-300">
            By accessing or using IIIT Bhopal Resume Analyzer's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Use License</h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>Permission is granted to temporarily use our platform for personal, non-commercial use only</li>
            <li>This license shall automatically terminate if you violate any of these restrictions</li>
            <li>Upon termination, you must destroy any downloaded materials</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Disclaimer</h2>
          <p className="text-gray-600 dark:text-gray-300">
            The materials on IIIT Bhopal Resume Analyzer's platform are provided on an 'as is' basis. IIIT Bhopal Resume Analyzer makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Limitations</h2>
          <p className="text-gray-600 dark:text-gray-300">
            In no event shall IIIT Bhopal Resume Analyzer or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Governing Law</h2>
          <p className="text-gray-600 dark:text-gray-300">
            These terms and conditions are governed by and construed in accordance with applicable laws, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Contact Information</h2>
          <p className="text-gray-600 dark:text-gray-300">
            If you have any questions about these Terms of Service, please contact us at legal@iiitbhopalresumeanalyzer.com
          </p>
        </section>
      </div>
    </div>
  );
} 