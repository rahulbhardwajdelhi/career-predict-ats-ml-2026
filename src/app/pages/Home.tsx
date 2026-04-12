import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">Welcome to IIIT Bhopal Resume Analyzer</h1>
      <p className="text-xl mb-8">
        Upload your resume and get personalized career predictions
      </p>
      <Link
        to="/resume"
        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
};

export default Home; 