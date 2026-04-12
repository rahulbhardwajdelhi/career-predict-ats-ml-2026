'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

export default function UserReference() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
  const faqs: FAQItem[] = [
    {
      question: 'How does IIIT Bhopal Resume Analyzer help me find a job?',
      answer: (
        <div className="space-y-2">
          <p>IIIT Bhopal Resume Analyzer uses advanced AI to analyze your resume and match it with job opportunities. The process works in three main steps:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Upload your resume in PDF format</li>
            <li>Our AI parses your skills, experience, and education</li>
            <li>We match your profile with relevant job listings and provide placement predictions</li>
          </ol>
          <p>This helps you identify opportunities that align with your skills and experience, increasing your chances of getting hired.</p>
        </div>
      ),
    },
    {
      question: 'How accurate is the resume parsing?',
      answer: (
        <div className="space-y-2">
          <p>Our resume parsing technology is highly accurate and can correctly identify:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Contact information and personal details</li>
            <li>Work experience with job titles, companies, and dates</li>
            <li>Education background including degrees and institutions</li>
            <li>Skills, certifications, and other qualifications</li>
          </ul>
          <p>For best results, we recommend using a clean, well-structured resume format. If any information is parsed incorrectly, you can easily edit it using our form or table view.</p>
        </div>
      ),
    },
    {
      question: 'How do I optimize my resume for better job matches?',
      answer: (
        <div className="space-y-2">
          <p>To improve your job matches and placement predictions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Use relevant keywords</strong> - Include industry-specific terms and skills that match job descriptions</li>
            <li><strong>Be specific about your skills</strong> - List technical skills, software proficiency, and certifications</li>
            <li><strong>Quantify achievements</strong> - Use numbers and percentages to demonstrate impact</li>
            <li><strong>Highlight recent experience</strong> - Emphasize your most recent and relevant positions</li>
            <li><strong>Include education details</strong> - Specify degrees, institutions, and graduation dates</li>
          </ul>
          <p>After uploading your resume, you can use our editor to enhance these elements before running the job matching tool.</p>
        </div>
      ),
    },
    {
      question: 'How do I match my skills with job descriptions?',
      answer: (
        <div className="space-y-2">
          <p>Matching your skills with job descriptions is crucial for success. Here's how IIIT Bhopal Resume Analyzer helps you do this effectively:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Skill extraction</strong> - We automatically identify skills from your resume</li>
            <li><strong>Keyword analysis</strong> - We analyze job descriptions for required skills and qualifications</li>
            <li><strong>Match scoring</strong> - We calculate a match percentage between your profile and job requirements</li>
            <li><strong>Gap identification</strong> - We highlight skills you may need to develop or emphasize</li>
          </ol>
          <p>This process helps you focus on applying for positions where you have a high match score, increasing your chances of getting interviews.</p>
        </div>
      ),
    },
    {
      question: 'What types of files can I upload?',
      answer: (
        <div>
          <p>Currently, we support PDF files only. For best results, ensure your PDF contains selectable text and not just images. We're working on adding support for more file formats in the future.</p>
        </div>
      ),
    },
    {
      question: 'How can I improve my chances of getting hired?',
      answer: (
        <div className="space-y-2">
          <p>Beyond having a well-optimized resume, you can improve your hiring chances by:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Tailoring applications</strong> - Customize your resume for each position</li>
            <li><strong>Building relevant skills</strong> - Focus on developing in-demand skills for your industry</li>
            <li><strong>Networking</strong> - Connect with professionals in your field</li>
            <li><strong>Preparing for interviews</strong> - Research common questions and practice your responses</li>
            <li><strong>Following up</strong> - Send thank-you notes after interviews</li>
          </ul>
          <p>IIIT Bhopal Resume Analyzer can help you identify the skills and experiences to emphasize in your applications and interviews.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-4xl font-bold text-blue-violet-700 dark:text-blue-violet-300 mb-6">User Reference Guide</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Learn how to maximize IIIT Bhopal Resume Analyzer to boost your job search and career opportunities
        </p>
      </div>

      {/* How It Works Section */}
      <section className="mb-16 animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
          How IIIT Bhopal Resume Analyzer Works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-blue-violet-600 dark:text-blue-violet-400 text-xl font-bold">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upload Your Resume</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start by uploading your PDF resume. Our AI will analyze and extract your skills, experience, and qualifications.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-blue-violet-600 dark:text-blue-violet-400 text-xl font-bold">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Review & Edit Data</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Verify the extracted information and make any necessary edits to ensure accuracy before proceeding to analysis.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-blue-violet-600 dark:text-blue-violet-400 text-xl font-bold">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Get Matched With Jobs</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Receive personalized job matches based on your profile and see how well your skills align with market demands.
            </p>
          </div>
        </div>
      </section>

      {/* Tips for Success Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
          Tips for Resume Success
        </h2>
        
        <div className="bg-gradient-to-r from-blue-violet-50 to-purple-50 dark:from-blue-violet-950/30 dark:to-purple-950/30 rounded-lg p-6 shadow-sm">
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="bg-blue-violet-100 dark:bg-blue-violet-900/50 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4 text-blue-violet-600 dark:text-blue-violet-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Use industry-specific keywords</strong>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Include relevant terms from job descriptions to improve your match score and pass ATS filters.
                </p>
              </div>
            </li>
            
            <li className="flex items-start">
              <div className="bg-blue-violet-100 dark:bg-blue-violet-900/50 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4 text-blue-violet-600 dark:text-blue-violet-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Quantify your achievements</strong>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Use numbers and percentages to demonstrate the impact of your work (e.g., "Increased sales by 25%").
                </p>
              </div>
            </li>
            
            <li className="flex items-start">
              <div className="bg-blue-violet-100 dark:bg-blue-violet-900/50 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4 text-blue-violet-600 dark:text-blue-violet-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Tailor your resume for each application</strong>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Customize your resume to highlight the most relevant experience and skills for each specific job.
                </p>
              </div>
            </li>
            
            <li className="flex items-start">
              <div className="bg-blue-violet-100 dark:bg-blue-violet-900/50 rounded-full p-1 mr-3 mt-1">
                <svg className="h-4 w-4 text-blue-violet-600 dark:text-blue-violet-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Keep formatting clean and consistent</strong>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Use a simple, professional layout that's easy for both humans and AI to parse.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
            >
              <button
                className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                <ChevronDownIcon 
                  className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`} 
                />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="p-4 bg-gray-50 dark:bg-gray-750 text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
} 