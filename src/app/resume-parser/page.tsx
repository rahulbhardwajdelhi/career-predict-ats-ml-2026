"use client";
import { useState, useEffect } from "react";
import { readPdf } from "lib/parse-resume-from-pdf/read-pdf";
import type { TextItems } from "lib/parse-resume-from-pdf/types";
import { groupTextItemsIntoLines } from "lib/parse-resume-from-pdf/group-text-items-into-lines";
import { groupLinesIntoSections } from "lib/parse-resume-from-pdf/group-lines-into-sections";
import { extractResumeFromSections } from "lib/parse-resume-from-pdf/extract-resume-from-sections";
import { ResumeDropzone } from "../components/ResumeDropzone";
import { ResumeTable } from "./ResumeTable";
import { ParsedForm } from "./ParsedForm";
import { AtsCheckerModal } from "../components/AtsCheckerModal";
import type { Resume } from "lib/redux/types";
import { initialResumeState } from "lib/redux/resumeSlice";
import { processSkillsFromDescriptions } from "lib/parse-resume-from-pdf/extract-resume-from-sections/extract-skills";
import { TableCellsIcon, DocumentTextIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export default function ResumeParser() {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [textItems, setTextItems] = useState<TextItems>([]);
  const [resume, setResume] = useState<Resume>(initialResumeState);
  const [activeTab, setActiveTab] = useState("table");
  const [isLoading, setIsLoading] = useState(false);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);

  // Check local storage for resume on initial load
  useEffect(() => {
    const savedResume = localStorage.getItem("resume");
    if (savedResume) {
      try {
        const parsedResume = JSON.parse(savedResume);
        setResume(parsedResume);
      } catch (error) {
        console.error("Error parsing saved resume:", error);
      }
    }
  }, []);

  useEffect(() => {
    async function loadPdf() {
      if (fileUrl) {
        setIsLoading(true);
        try {
          const textItems = await readPdf(fileUrl);
          setTextItems(textItems);
          
          const lines = groupTextItemsIntoLines(textItems || []);
          const sections = groupLinesIntoSections(lines);
          const extractedResume = extractResumeFromSections(sections);
          setResume(extractedResume);
          
          // Process skills separately after initial load
          if (extractedResume.skills && extractedResume.skills.descriptions.length > 0) {
            try {
              const processedSkills = await processSkillsFromDescriptions(
                extractedResume.skills.descriptions
              );
              
              if (processedSkills.length > 0) {
                // Update resume with processed skills
                const updatedResume = {
                  ...extractedResume,
                  skills: {
                    ...extractedResume.skills,
                    descriptions: processedSkills
                  }
                };
                setResume(updatedResume);
                // Save to localStorage
                localStorage.setItem("resume", JSON.stringify(updatedResume));
              }
            } catch (error) {
              console.error("Error processing skills:", error);
            }
          } else {
            // Save to localStorage
            localStorage.setItem("resume", JSON.stringify(extractedResume));
          }
        } catch (error) {
          console.error("Error processing resume:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadPdf();
  }, [fileUrl]);

  const updateResume = (updatedResume: Resume) => {
    setResume(updatedResume);
    // Save updated resume to localStorage
    localStorage.setItem("resume", JSON.stringify(updatedResume));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl transition-all duration-300">
      <h1 className="text-3xl font-bold mb-6 text-blue-violet-700 dark:text-blue-violet-300">Resume Parser</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-300 max-w-3xl">
        Upload your resume to see how it would be parsed by Application Tracking Systems (ATS).
        The more information extracted, the better formatted your resume is for ATS systems.
      </p>
      
      <div className="mb-8 max-w-xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300">
          <ResumeDropzone
            onFileUrlChange={(url) => setFileUrl(url)}
            isLoading={isLoading}
          />
        </div>
      </div>

      {resume && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
            <h2 className="text-2xl font-semibold text-blue-violet-700 dark:text-blue-violet-300">
              Resume Parsing Results
            </h2>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="btn-secondary inline-flex items-center"
                onClick={() => setIsAtsModalOpen(true)}
              >
                <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                ATS Score & Insights
              </button>

              <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-l-lg ${
                  activeTab === 'table'
                    ? "bg-blue-violet-600 text-white dark:bg-blue-violet-700"
                    : "bg-white text-gray-700 hover:bg-blue-violet-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                } border border-gray-200 dark:border-gray-700 transition-colors duration-200`}
                onClick={() => setActiveTab('table')}
              >
                <TableCellsIcon className="w-4 h-4 mr-2" />
                Table View
              </button>
              <button
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-r-lg ${
                  activeTab === 'form'
                    ? "bg-blue-violet-600 text-white dark:bg-blue-violet-700"
                    : "bg-white text-gray-700 hover:bg-blue-violet-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                } border border-gray-200 dark:border-gray-700 border-l-0 transition-colors duration-200`}
                onClick={() => setActiveTab('form')}
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Form View
              </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 animate-slide-up">
            {activeTab === 'table' ? (
              <ResumeTable resume={resume} updateResume={updateResume} />
            ) : (
              <ParsedForm resume={resume} updateResume={updateResume} />
            )}
          </div>

          <AtsCheckerModal
            isOpen={isAtsModalOpen}
            onClose={() => setIsAtsModalOpen(false)}
            resume={resume}
          />
        </div>
      )}
    </div>
  );
}
