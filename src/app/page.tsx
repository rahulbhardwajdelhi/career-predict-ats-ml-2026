"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { readPdf } from "lib/parse-resume-from-pdf/read-pdf";
import type { TextItems } from "lib/parse-resume-from-pdf/types";
import type { Resume } from "lib/redux/types";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { groupLinesIntoSections } from "lib/parse-resume-from-pdf/group-lines-into-sections";
import { extractResumeFromSections } from "lib/parse-resume-from-pdf/extract-resume-from-sections";
import { ResumeDropzone } from "./components/ResumeDropzone";
import { ResumeTable } from "./resume-parser/ResumeTable";
import { ParsedForm } from "./resume-parser/ParsedForm";
import { DocumentTextIcon, InformationCircleIcon, TableCellsIcon, DocumentTextIcon as FormIcon, ArrowRightIcon, LightBulbIcon } from "@heroicons/react/24/outline";
import { deepClone } from "lib/deep-clone";
import { initialResumeState } from "lib/redux/resumeSlice";
import { FeedbackForm } from "./components/FeedbackForm";

// Component to show hints for better parsing
const ParsingHints = () => (
  <div className="bg-blue-violet-50 dark:bg-blue-violet-900/20 border border-blue-violet-200 dark:border-blue-violet-800 rounded-lg p-4 mt-6 mb-2 text-sm">
    <div className="flex items-start">
      <InformationCircleIcon className="h-5 w-5 text-blue-violet-500 mr-2 mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="font-medium text-blue-violet-800 dark:text-blue-violet-200">Tips for better parsing:</h3>
        <ul className="mt-1 space-y-1 text-blue-violet-700 dark:text-blue-violet-300 ml-4 list-disc">
          <li>Use single-column resume layouts for best results</li>
          <li>Clearly label sections (Education, Experience, Skills, etc.)</li>
          <li>Include your full school name with location</li>
          <li>Specify whether grades are GPA (0-4.0 scale) or percentage</li>
          <li>Use consistent date formats (e.g., MM/YYYY or Year-Year)</li>
        </ul>
      </div>
    </div>
  </div>
);

// Toggle button for switching between table and form views
const ViewToggle = ({ view, setView }: { view: "table" | "form"; setView: (view: "table" | "form") => void }) => (
  <div className="flex justify-end mb-4">
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <button
        type="button"
        onClick={() => setView("table")}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-l-lg ${
          view === "table"
            ? "bg-blue-violet-600 text-white dark:bg-blue-violet-700"
            : "bg-white text-gray-700 hover:bg-blue-violet-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        } border border-gray-200 dark:border-gray-700 transition-colors duration-200`}
      >
        <TableCellsIcon className="w-4 h-4 mr-2" />
        Table View
      </button>
      <button
        type="button"
        onClick={() => setView("form")}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-r-lg ${
          view === "form"
            ? "bg-blue-violet-600 text-white dark:bg-blue-violet-700"
            : "bg-white text-gray-700 hover:bg-blue-violet-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        } border border-gray-200 dark:border-gray-700 border-l-0 transition-colors duration-200`}
      >
        <FormIcon className="w-4 h-4 mr-2" />
        Form View
      </button>
    </div>
  </div>
);

// Add the StatCard component below all the existing imports 
const StatCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center transition-transform duration-300 hover:transform hover:scale-105 border border-gray-100 dark:border-gray-700">
    <div className="text-3xl font-bold text-blue-violet-600 dark:text-blue-violet-400 mb-2">{number}</div>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

// Feature cards
const FeatureCard = ({ title, description, icon, onClick, actionText }: { title: string; description: string; icon: React.ReactNode; onClick?: () => void; actionText?: string }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
    <div className="flex items-start">
      <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 p-3 rounded-full mr-4">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mt-1">{description}</p>
      </div>
    </div>
    {onClick && actionText && (
      <button
        onClick={onClick}
        className="mt-4 w-full px-4 py-2 text-sm font-medium rounded-lg bg-blue-violet-500 hover:bg-blue-violet-600 text-white flex items-center justify-center transition-colors duration-200"
      >
        {actionText}
        <ArrowRightIcon className="h-4 w-4 ml-2" />
      </button>
    )}
  </div>
);

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [showUploader, setShowUploader] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [textItems, setTextItems] = useState<TextItems>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"table" | "form">("table");
  const [resume, setResume] = useState<Resume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Clear resume data when navigating to home page
  useEffect(() => {
    if (pathname === '/') {
      setResume(null);
      setShowUploader(false);
      setFileUrl("");
      setTextItems([]);
      setError(null);
      setUploadSuccess(false);
      localStorage.removeItem("resume");
    }
  }, [pathname]);

  // Handle navigation through router
  const handleNavigation = (path: string) => {
    if (path === '/') {
      setResume(null);
      setShowUploader(false);
      setFileUrl("");
      setTextItems([]);
      setError(null);
      setUploadSuccess(false);
      localStorage.removeItem("resume");
    }
    router.push(path);
  };

  // Check localStorage for previously saved resume on initial load
  useEffect(() => {
    const savedResume = localStorage.getItem("resume");
    if (savedResume && pathname !== '/') {
      try {
        const parsedResume = JSON.parse(savedResume);
        // Only set the resume if it's a valid resume object with required fields
        if (parsedResume && parsedResume.profile) {
          setResume(parsedResume);
        }
      } catch (error) {
        console.error("Error parsing saved resume:", error);
        // Invalid JSON in localStorage, remove it
        localStorage.removeItem("resume");
      }
    }
  }, [pathname]);

  // When file is uploaded via fileUrl, parse the resume
  useEffect(() => {
    async function loadPdf() {
      if (fileUrl) {
        setIsLoading(true);
        try {
          const textItems = await readPdf(fileUrl);
          setTextItems(textItems);
          
          // Process the text items to extract the resume data
          const lines = groupTextItemsIntoLines(textItems);
          const sections = groupLinesIntoSections(lines);
          const parsedResume = extractResumeFromSections(sections);
          
          // Set the initial resume state
          setResume(parsedResume);
          setUploadSuccess(true);
          
          // Save to localStorage for persistence
          localStorage.setItem("resume", JSON.stringify(parsedResume));
        } catch (error) {
          console.error("Error parsing resume:", error);
          setError("Failed to parse the resume. Please try a different file.");
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadPdf();
  }, [fileUrl]);

  // The update function that both the table and form will use
  const handleResumeUpdate = (updatedResume: Resume) => {
    setResume(deepClone(updatedResume));
    // Update localStorage
    localStorage.setItem("resume", JSON.stringify(updatedResume));
  };

  // Effect to handle successful uploads
  useEffect(() => {
    if (uploadSuccess && !isLoading && resume) {
      // Wait a moment to show the success state before transitioning to results
      const timer = setTimeout(() => {
        // Transition is handled by the conditional rendering
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess, isLoading, resume]);

  // Direct file upload handler for the "Analyze Placement" path
  const onFileUpload = async (file: File) => {
    if (!file.size) return; // Empty file, like when removing a file
    
    try {
      setIsLoading(true);
      setError(null);
      setUploadSuccess(false);

      const textItems = await extractTextItemsFromPdf(file);
      if (!textItems.length) {
        throw new Error(
          "Could not extract any text from the resume. Make sure the PDF contains selectable text and not just images."
        );
      }

      const lines = groupTextItemsIntoLines(textItems);
      const sections = groupLinesIntoSections(lines);
      const resume = extractResumeFromSections(sections);

      // Store resume data in localStorage
      const resumeWithDefaults = {
        ...deepClone(initialResumeState),
        ...resume,
      };
      localStorage.setItem("resume", JSON.stringify(resumeWithDefaults));
      setResume(resumeWithDefaults);
      setUploadSuccess(true);
    } catch (error: any) {
      console.error(error);
      setError(error.message || "An error occurred while parsing the resume.");
    } finally {
      setIsLoading(false);
    }
  };

  // First page - intro and "Get Started" button
  if (!showUploader && !resume) {
    return (
      <div className="container mx-auto py-16 max-w-6xl transition-all duration-300">
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Predict Your Career Path
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-10 text-blue-violet-600 dark:text-blue-violet-400">
            With AI-Powered Insights
          </h2>
          
          <p className="text-lg text-center mb-12 max-w-2xl text-gray-600 dark:text-gray-300">
            Use advanced machine learning to predict your placement outcomes and find the 
            perfect job match based on your skills and experience.
          </p>

          {/* Feature Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 w-full max-w-4xl mb-12">
            {/* Placement Prediction Card */}
            <div 
              onClick={() => {
                setShowUploader(true);
                setResume(null);
              }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
            >
              <div className="flex items-start">
                <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 p-3 rounded-full mr-4">
                  <svg className="h-8 w-8 text-blue-violet-600 dark:text-blue-violet-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L3 9L12 14L21 9L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 14L12 19L21 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Placement Prediction</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Enter your academic details and skills to get personalized placement predictions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="w-full max-w-6xl mx-auto py-16 px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Your Path to Success
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* ATS-Optimized Resume */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
                <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 p-3 rounded-full w-fit mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-blue-violet-600 dark:text-blue-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">ATS-Optimized Resume</h3>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  Get insights on how your resume performs against ATS systems and receive optimization suggestions.
                </p>
              </div>

              {/* Smart Job Matching */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
                <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 p-3 rounded-full w-fit mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-blue-violet-600 dark:text-blue-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Smart Job Matching</h3>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  AI-powered job matching that connects you with opportunities aligned to your skills and experience.
                </p>
              </div>

              {/* Career Guidance */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
                <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 p-3 rounded-full w-fit mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-blue-violet-600 dark:text-blue-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Career Guidance</h3>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  Get personalized career advice and insights to make informed decisions about your professional journey.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="w-full max-w-6xl mx-auto py-16 px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
                <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 p-3 rounded-full w-fit mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-blue-violet-600 dark:text-blue-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">Upload Resume</h3>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  Begin your journey by uploading your PDF resume to our secure platform. Our advanced AI system accepts various resume layouts and formats, ensuring a smooth experience. The upload process is quick and straightforward, with instant processing and data protection.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
                <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 p-3 rounded-full w-fit mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-blue-violet-600 dark:text-blue-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">Get Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  Our sophisticated AI engine thoroughly analyzes your resume against current ATS standards and industry requirements. Receive comprehensive feedback on formatting, keyword optimization, and content structure. Get detailed insights into how well your resume matches job requirements.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
                <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 p-3 rounded-full w-fit mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-blue-violet-600 dark:text-blue-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">Match Jobs</h3>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  Using advanced machine learning algorithms, we match your profile with thousands of job opportunities across various industries. Our system considers your skills, experience, and career preferences to find the most relevant positions. Get personalized job recommendations that align with your career goals.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
                <div className="bg-blue-violet-100 dark:bg-blue-violet-900/30 p-3 rounded-full w-fit mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="h-6 w-6 text-blue-violet-600 dark:text-blue-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">Get Hired</h3>
                <p className="text-gray-600 dark:text-gray-300 text-justify">
                  Apply to positions with an optimized resume that effectively showcases your qualifications. Track your application status and receive guidance throughout the hiring process. Get insights into company culture and interview preparation tips to increase your chances of landing your dream job.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="w-full px-8">
            <div className=" bg-blue-violet-50 dark:bg-blue-violet-900/20 py-16 rounded-lg">
              <div className="max-w-4xl mx-auto text-center px-4">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                Ready to Transform Your Career?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">
                Join thousands of professionals who've already taken the first step towards their dream job.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowUploader(true);
                    setResume(null);
                  }}
                  className="bg-blue-violet-600 hover:bg-blue-violet-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  Getting Started
                  <svg 
                    className="h-5 w-5 ml-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Resume uploader page
  if (showUploader && !resume) {
    return (
      <div className="container mx-auto py-8 max-w-6xl transition-all duration-300">
        <div className="flex flex-col items-center justify-center animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-blue-violet-700 dark:text-blue-violet-300 animate-slide-down">
            Upload Your Resume
          </h1>
          
          <p className="text-lg text-center mb-8 max-w-2xl text-gray-600 dark:text-gray-300 animate-slide-down">
            Upload your resume to see how it would be parsed by Application Tracking Systems (ATS),
            edit the extracted information, and analyze your job placement opportunities.
          </p>

          <div className="w-full max-w-xl transition-all duration-300 transform hover:scale-[1.01] animate-slide-up">
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border ${uploadSuccess ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'} p-8 transition-all duration-300`}>
              {uploadSuccess && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 rounded-lg flex items-center animate-fade-in">
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Resume uploaded successfully! Processing...</p>
                </div>
              )}
              
              <ResumeDropzone 
                onFileUpload={onFileUpload} 
                onFileUrlChange={(url) => setFileUrl(url)}
                isLoading={isLoading} 
              />
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg animate-fade-in">
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
          
          <ParsingHints />
        </div>
      </div>
    );
  }

  // Results page - resume parsing results
  return (
    <div className="container mx-auto py-8 max-w-6xl transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-violet-700 dark:text-blue-violet-300 animate-fade-in">Resume Parsing Results</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFeedback(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-violet-100 dark:bg-blue-violet-900/30 text-blue-violet-700 dark:text-blue-violet-300 hover:bg-blue-violet-200 dark:hover:bg-blue-violet-800/30 transition-colors duration-200 animate-fade-in flex items-center"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Give Feedback
          </button>
          
          <button
            onClick={() => {
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: 'My Resume Parsing Results',
                  text: 'Check out my resume analysis from Open Resume!',
                  url: window.location.href,
                }).catch((error) => console.log('Error sharing', error));
              } else {
                // Fallback - copy link to clipboard
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-violet-500 hover:bg-blue-violet-600 text-white transition-colors duration-200 animate-fade-in flex items-center"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </button>
          
          <button
            onClick={() => {
              setResume(null);
              setFileUrl("");
              setUploadSuccess(false);
              // Keep showUploader true to go back to the upload page
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200 animate-fade-in flex items-center"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Upload Different Resume
          </button>
        </div>
      </div>
      
      <ViewToggle view={view} setView={setView} />
      
      {/* Job Matching Prompt */}
      <div className="bg-gradient-to-r from-blue-violet-50 to-blue-100 dark:from-blue-violet-900/20 dark:to-blue-800/20 rounded-lg p-6 my-6 border border-blue-violet-200 dark:border-blue-violet-800 shadow-sm animate-fade-in">
        <div className="flex items-start md:items-center flex-col md:flex-row">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-blue-violet-800 dark:text-blue-violet-300 mb-2">
              Find matching job opportunities
            </h3>
            <p className="text-blue-violet-700 dark:text-blue-violet-400 mb-4 md:mb-0">
              We'll analyze your resume and find job listings that match your skills and experience
            </p>
          </div>
          <div className="md:ml-4">
            <button 
              onClick={() => {
                // This would typically open the JobListingsModal component 
                alert('This would open the job listings modal in a complete implementation');
              }}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-violet-600 hover:bg-blue-violet-700 text-white transition-colors duration-200 flex items-center"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              Find Matching Jobs
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 animate-slide-up">
        {view === "table" && resume ? (
          <ResumeTable resume={resume} updateResume={handleResumeUpdate} />
        ) : resume ? (
          <ParsedForm resume={resume} updateResume={handleResumeUpdate} />
        ) : null}
      </div>
      
      <ParsingHints />
      
      {showFeedback && <FeedbackForm onClose={() => setShowFeedback(false)} />}
    </div>
  );
}

async function extractTextItemsFromPdf(file: File): Promise<TextItems> {
  try {
    // Create a URL for the file and pass that to readPdf
    const fileUrl = URL.createObjectURL(file);
    const textItems = await readPdf(fileUrl);
    
    // Clean up the object URL after use
    URL.revokeObjectURL(fileUrl);
    
    return textItems;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from the PDF. Please try a different file.");
  }
}
