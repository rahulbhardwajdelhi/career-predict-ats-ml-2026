import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose dark:prose-invert">
        <p className="mb-4">
          Your privacy is important to us. It is IIIT Bhopal Resume Analyzer's policy to respect your privacy regarding
          any information we may collect from you across our website.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-4">Information We Collect</h2>
        <p className="mb-4">
          We only ask for personal information when we truly need it to provide a service to you. We collect
          it by fair and lawful means, with your knowledge and consent.
        </p>
        <h2 className="text-2xl font-semibold mt-6 mb-4">How We Use Your Information</h2>
        <p className="mb-4">
          We use the information we collect in various ways, including to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide, operate, and maintain our website</li>
          <li>Improve, personalize, and expand our website</li>
          <li>Understand and analyze how you use our website</li>
          <li>Develop new products, services, features, and functionality</li>
        </ul>
        <h2 className="text-2xl font-semibold mt-6 mb-4">Data Security</h2>
        <p className="mb-4">
          We value your trust in providing us your personal information, thus we are striving to use
          commercially acceptable means of protecting it.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 