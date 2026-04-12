import React from 'react';

const UserReference: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">User Reference Guide</h1>
      <div className="prose dark:prose-invert">
        <h2 className="text-2xl font-semibold mt-6 mb-4">Getting Started</h2>
        <p className="mb-4">
          Welcome to IIIT Bhopal Resume Analyzer! This guide will help you make the most of our platform.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">1. Upload Your Resume</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Click on the "Resume" link in the navigation menu</li>
          <li>Drag and drop your resume file into the upload area</li>
          <li>Supported formats: PDF, DOC, DOCX</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">2. Fill in Additional Details</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Complete your personal information</li>
          <li>Add your professional summary</li>
          <li>List your skills (comma-separated)</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">3. Get IIIT Bhopal Resume Analyzerions</h3>
        <ul className="list-disc pl-6 mb-4">
          <li>Review your resume preview</li>
          <li>Submit for career analysis</li>
          <li>Receive personalized career recommendations</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Tips for Best Results</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Keep your resume up to date</li>
          <li>Be specific about your skills and experience</li>
          <li>Include relevant certifications and achievements</li>
          <li>Use clear and concise language</li>
        </ul>
      </div>
    </div>
  );
};

export default UserReference; 