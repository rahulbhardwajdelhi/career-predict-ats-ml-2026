import { useState, useEffect } from "react";
import type { Resume, ResumeEducation, ResumeWorkExperience, ResumeProject, ResumeCertification } from "lib/redux/types";
import { deepClone } from "lib/deep-clone";
import { initialEducation, initialWorkExperience, initialCertification } from "lib/redux/resumeSlice";
import { PencilIcon, CheckIcon, XMarkIcon, QuestionMarkCircleIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { SkillsForm } from "./SkillsForm";
import { JobListingsModal } from "../components/JobListingsModal";
import { AtsCheckerModal } from "../components/AtsCheckerModal";
import { useJobListings } from "../lib/hooks/useJobListings";

const FormSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-lg font-medium text-blue-violet-700 dark:text-blue-violet-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

interface FormFieldProps {
  label: string;
  value: string;
  onValueChange?: (value: string) => void;
}

const FormField = ({ label, value, onValueChange }: FormFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  // Update edit value when external value changes and not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value || '');
    }
  }, [value, isEditing]);

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(value || '');
  };

  const saveChanges = () => {
    if (onValueChange) {
      let valueToSave = editValue.trim();
      
      // Special case for phone formatting
      if (label === "Phone") {
        // Extract digits
        const digits = valueToSave.replace(/\D/g, '');
        
        // Only apply formatting if we have enough digits
        if (digits.length >= 10) {
          // Format based on digit count (using the specified format)
          if (digits.length === 10) {
            // Format: first 5 digits, then next 5 digits
            valueToSave = `${digits.substring(0, 5)} ${digits.substring(5)}`;
          } else if (digits.length > 10) {
            // Format: country code with plus sign, space, first 5 digits, space, remaining digits
            const countryCode = digits.substring(0, digits.length - 10);
            const remaining = digits.substring(digits.length - 10);
            valueToSave = `+${countryCode} ${remaining.substring(0, 5)} ${remaining.substring(5)}`;
          }
        }
      }
      
      onValueChange(valueToSave);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  return (
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {!isEditing ? (
        <div className="flex items-center justify-between border rounded-md py-2 px-3 bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 text-sm min-h-[38px] border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div>{value || <span className="text-gray-400 dark:text-gray-500 italic">Not found</span>}</div>
          {onValueChange && (
            <button 
              onClick={startEditing}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Edit this field"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full border rounded-md p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-violet-400 dark:focus:ring-blue-violet-500"
              autoFocus
            />
            <div className="flex ml-2">
              <button 
                onClick={saveChanges}
                className="p-1 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Save changes"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={cancelEdit}
                className="p-1 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Cancel edit"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FormFieldArrayProps {
  label: string;
  values: string[];
  onValueChange?: (values: string[]) => void;
}

const FormFieldArray = ({ label, values, onValueChange }: FormFieldArrayProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(values.join('\n'));

  // Update edit value when external values change and not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(values.join('\n'));
    }
  }, [values, isEditing]);

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(values.join('\n'));
  };

  const saveChanges = () => {
    if (onValueChange) {
      // Filter out empty lines
      const newValues = editValue
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
      
      onValueChange(newValues);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(values.join('\n'));
    setIsEditing(false);
  };

  return (
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {!isEditing ? (
        <div className="flex items-start justify-between border rounded-md py-2 px-3 bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 text-sm min-h-[38px] border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="w-full">
            {values.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {values.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 italic">Not found</span>
            )}
          </div>
          {onValueChange && (
            <button 
              onClick={startEditing}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
              title="Edit this field"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full border rounded-md p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-violet-400 dark:focus:ring-blue-violet-500"
            rows={Math.max(4, values.length + 1)}
            autoFocus
            placeholder="Enter each item on a new line"
          />
          <div className="flex mt-1 justify-end">
            <button 
              onClick={saveChanges}
              className="p-1 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 mr-1"
              title="Save changes"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
            <button 
              onClick={cancelEdit}
              className="p-1 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Cancel edit"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface EducationFormProps {
  education: ResumeEducation;
  index: number;
  onUpdate: (field: keyof ResumeEducation, value: string | string[]) => void;
}

const EducationForm = ({ education, index, onUpdate }: EducationFormProps) => {
  // Get label based on education type, not index
  const getLabel = () => {
    if (education.educationType === "University") {
      return "University Education";
    } else if (education.educationType === "12th") {
      return "Higher Secondary Education";
    } else if (education.educationType === "10th") {
      return "Secondary Education";
    } else {
      return `Education ${index + 1}`;
    }
  };

  // Get the appropriate label for GPA/Percentage based on education type
  const getGradeLabel = () => {
    if (education.educationType === "University") {
      return "CGPA";
    } else {
      return "Percentage";
    }
  };
  
  // Format the grade value based on education type
  const formatGradeValue = (value: string) => {
    if (!value) return "";
    
    // For percentage (12th, 10th), add % sign if not present
    if (education.educationType !== "University") {
      if (!value.endsWith('%') && !isNaN(parseFloat(value))) {
        return `${parseFloat(value).toFixed(2)}%`;
      }
    }
    
    return value;
  };

  return (
    <div className="border rounded-md p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm mb-4 transition-all duration-300">
      <h4 className="text-md font-medium mb-3 text-blue-violet-600 dark:text-blue-violet-300">{getLabel()}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField 
          label="School" 
          value={education.school} 
          onValueChange={(value) => onUpdate('school', value)}
        />
        <FormField 
          label="Degree" 
          value={education.degree} 
          onValueChange={(value) => onUpdate('degree', value)}
        />
        <FormField 
          label={getGradeLabel()} 
          value={formatGradeValue(education.gpa)} 
          onValueChange={(value) => {
            // Remove % sign if present when saving
            const cleanValue = value.replace(/%/g, '').trim();
            onUpdate('gpa', cleanValue);
          }}
        />
        <FormField 
          label="Date" 
          value={education.date} 
          onValueChange={(value) => onUpdate('date', value)}
        />
      </div>
      <div className="mt-4">
        <FormFieldArray 
          label="Descriptions" 
          values={education.descriptions} 
          onValueChange={(values) => onUpdate('descriptions', values)}
        />
      </div>
    </div>
  );
};

interface WorkExperienceFormProps {
  experience: ResumeWorkExperience;
  index: number;
  onUpdate: (field: keyof ResumeWorkExperience, value: string | string[]) => void;
}

const WorkExperienceForm = ({ experience, index, onUpdate }: WorkExperienceFormProps) => (
  <div className="border rounded-md p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm mb-4 transition-all duration-300">
    <h4 className="text-md font-medium mb-3 text-blue-violet-600 dark:text-blue-violet-300">Work Experience #{index + 1}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField 
        label="Company" 
        value={experience.company} 
        onValueChange={(value) => onUpdate('company', value)}
      />
      <FormField 
        label="Job Title" 
        value={experience.jobTitle} 
        onValueChange={(value) => onUpdate('jobTitle', value)}
      />
      <FormField 
        label="Date" 
        value={experience.date} 
        onValueChange={(value) => onUpdate('date', value)}
      />
    </div>
    <div className="mt-4">
      <FormFieldArray 
        label="Descriptions" 
        values={experience.descriptions} 
        onValueChange={(values) => onUpdate('descriptions', values)}
      />
    </div>
  </div>
);

interface ProjectFormProps {
  project: ResumeProject;
  index: number;
  onUpdate: (field: keyof ResumeProject, value: string | string[]) => void;
}

const ProjectForm = ({ project, index, onUpdate }: ProjectFormProps) => (
  <div className="border rounded-md p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm mb-4 transition-all duration-300">
    <h4 className="text-md font-medium mb-3 text-blue-violet-600 dark:text-blue-violet-300">Project #{index + 1}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField 
        label="Project" 
        value={project.project} 
        onValueChange={(value) => onUpdate('project', value)}
      />
      <FormField 
        label="Date" 
        value={project.date} 
        onValueChange={(value) => onUpdate('date', value)}
      />
    </div>
    <div className="mt-4">
      <FormFieldArray 
        label="Descriptions" 
        values={project.descriptions}
        onValueChange={(values) => onUpdate('descriptions', values)}
      />
    </div>
  </div>
);

interface CertificationFormProps {
  certification: ResumeCertification;
  index: number;
  onUpdate: (field: keyof ResumeCertification, value: string | string[]) => void;
}

const CertificationForm = ({ certification, index, onUpdate }: CertificationFormProps) => {
  return (
    <div className="border rounded-md p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm mb-4 transition-all duration-300">
      <h4 className="text-md font-medium mb-3 text-blue-violet-600 dark:text-blue-violet-300">Certification #{index + 1}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField 
          label="Name" 
          value={certification.name} 
          onValueChange={(value) => onUpdate('name', value)}
        />
        <FormField 
          label="Date" 
          value={certification.date} 
          onValueChange={(value) => onUpdate('date', value)}
        />
      </div>
      <div className="mt-4">
        <FormFieldArray 
          label="Descriptions" 
          values={certification.descriptions} 
          onValueChange={(values) => onUpdate('descriptions', values)}
        />
      </div>
    </div>
  );
};

interface ParsedFormProps {
  resume: Resume;
  updateResume: (updatedResume: Resume) => void;
}

export const ParsedForm = ({ resume, updateResume }: ParsedFormProps) => {
  const { isModalOpen, openModal, closeModal } = useJobListings();
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);
  
  const educations =
    resume.educations.length === 0
      ? [deepClone(initialEducation)]
      : resume.educations;

  const workExperiences =
    resume.workExperiences.length === 0
      ? [deepClone(initialWorkExperience)]
      : resume.workExperiences;

  const certifications =
    resume.certifications.length === 0
      ? [deepClone(initialCertification)]
      : resume.certifications;
      
  // Process skills using the same logic as in ResumeTable component
  const skillsFromDescriptions = resume.skills.descriptions.slice();
  
  // Process descriptions that might contain categorized skills
  const processedSkillsFromDescriptions = skillsFromDescriptions.flatMap(description => {
    // Check if this is a categorized list (contains a colon)
    if (description.includes(':')) {
      // Split by colon and extract just the skills part
      const parts = description.split(':');
      if (parts.length === 2) {
        // Split the skills by comma and trim each one
        return parts[1].split(',').map(skill => skill.trim()).filter(Boolean);
      }
    }
    return description; // Return as is if not categorized
  });
  
  // Process featured skills
  const featuredSkills = resume.skills.featuredSkills
    .filter((item) => item.skill.trim())
    .map((item) => item.skill.trim());
  
  // Process featured skills (splitting both by comma and by category if present)
  const featuredSkillsFlat = featuredSkills.flatMap(skill => {
    if (skill.includes(':')) {
      const parts = skill.split(':');
      if (parts.length === 2) {
        return parts[1].split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return skill.split(',').map(s => s.trim()).filter(Boolean);
  });
  
  // Create a set of all skills to avoid duplicates
  const uniqueSkills = new Set([...featuredSkillsFlat, ...processedSkillsFromDescriptions]);
  
  // Convert back to array for display
  const skills = Array.from(uniqueSkills);

  // Functions to update different parts of the resume
  const updateProfile = (field: keyof typeof resume.profile, value: string) => {
    const updatedResume = deepClone(resume);
    updatedResume.profile[field] = value;
    updateResume(updatedResume);
  };

  const updateEducation = (index: number, field: keyof ResumeEducation, value: string | string[]) => {
    const updatedResume = deepClone(resume);
    updatedResume.educations[index][field] = value as any;
    updateResume(updatedResume);
  };

  const updateWorkExperience = (index: number, field: keyof ResumeWorkExperience, value: string | string[]) => {
    const updatedResume = deepClone(resume);
    updatedResume.workExperiences[index][field] = value as any;
    updateResume(updatedResume);
  };

  const updateProject = (index: number, field: keyof ResumeProject, value: string | string[]) => {
    const updatedResume = deepClone(resume);
    updatedResume.projects[index][field] = value as any;
    updateResume(updatedResume);
  };

  const updateSkills = (values: string[]) => {
    console.log("Updating skills with values:", values);
    
    const updatedResume = deepClone(resume);
    
    // Group skills if they were originally grouped
    const originalHadCategories = resume.skills.descriptions.some(desc => desc.includes(':'));
    
    if (originalHadCategories) {
      // Try to restore original categories if they existed
      const categoryMap = new Map<string, string[]>();
      
      // Extract categories from original descriptions
      resume.skills.descriptions.forEach(desc => {
        if (desc.includes(':')) {
          const [category, skillsList] = desc.split(':').map(part => part.trim());
          const categorySkills = skillsList.split(',').map(s => s.trim()).filter(Boolean);
          categoryMap.set(category, []);
        }
      });
      
      // Add uncategorized array for skills without a category
      if (!categoryMap.has('Other')) {
        categoryMap.set('Other', []);
      }
      
      // Assign each skill to its original category if possible, or to "Other"
      values.forEach(skill => {
        let assigned = false;
        
        // Try to find this skill in original categories
        for (const [category, originalSkills] of Array.from(categoryMap.entries())) {
          const originalDesc = resume.skills.descriptions.find(desc => 
            desc.startsWith(category + ':') && desc.toLowerCase().includes(skill.toLowerCase())
          );
          
          if (originalDesc) {
            categoryMap.get(category)?.push(skill);
            assigned = true;
            break;
          }
        }
        
        // If not found in any category, add to "Other"
        if (!assigned) {
          categoryMap.get('Other')?.push(skill);
        }
      });
      
      // Convert back to descriptions format
      const newDescriptions = [];
      for (const [category, categorySkills] of Array.from(categoryMap.entries())) {
        if (categorySkills.length > 0) {
          newDescriptions.push(`${category}: ${categorySkills.join(', ')}`);
        }
      }
      
      // Update the descriptions
      updatedResume.skills.descriptions = newDescriptions;
    } else {
      // If there were no categories originally, just use the values directly
    updatedResume.skills.descriptions = values;
    }
    
    // Clear any featured skills that have been removed
    updatedResume.skills.featuredSkills = updatedResume.skills.featuredSkills.filter(item => {
      return values.some(skill => item.skill.includes(skill));
    });
    
    updateResume(updatedResume);
  };

  const updateCertification = (index: number, field: keyof ResumeCertification, value: string | string[]) => {
    const updatedResume = deepClone(resume);
    updatedResume.certifications[index][field] = value as any;
    updateResume(updatedResume);
  };

  return (
    <>
      <div className="space-y-6 px-2 py-4">
        <FormSection title="Profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="Name" 
              value={resume.profile.name} 
              onValueChange={(value) => updateProfile('name', value)}
            />
            <FormField 
              label="Email" 
              value={resume.profile.email} 
              onValueChange={(value) => updateProfile('email', value)}
            />
            <FormField 
              label="Phone" 
              value={resume.profile.phone} 
              onValueChange={(value) => updateProfile('phone', value)}
            />
            <FormField 
              label="Location" 
              value={resume.profile.location} 
              onValueChange={(value) => updateProfile('location', value)}
            />
            <FormField 
              label="Link" 
              value={resume.profile.url} 
              onValueChange={(value) => updateProfile('url', value)}
            />
          </div>
          <div className="mt-2">
            <FormField 
              label="Summary" 
              value={resume.profile.summary} 
              onValueChange={(value) => updateProfile('summary', value)}
            />
          </div>
        </FormSection>

        <FormSection title="Education">
          {educations.map((education, idx) => (
            <EducationForm 
              key={idx} 
              education={education} 
              index={idx} 
              onUpdate={(field, value) => updateEducation(idx, field, value)}
            />
          ))}
        </FormSection>

        <FormSection title="Work Experience">
          {workExperiences.map((experience, idx) => (
            <WorkExperienceForm 
              key={idx} 
              experience={experience} 
              index={idx} 
              onUpdate={(field, value) => updateWorkExperience(idx, field, value)}
            />
          ))}
        </FormSection>

        <FormSection title="Skills">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 shadow-sm transition-all duration-300">
            <SkillsForm 
              skills={skills}
              onSkillsChange={updateSkills}
            />
          </div>
        </FormSection>

        {resume.projects.length > 0 && (
          <FormSection title="Projects">
            {resume.projects.map((project, idx) => (
              <ProjectForm 
                key={idx} 
                project={project} 
                index={idx} 
                onUpdate={(field, value) => updateProject(idx, field, value)}
              />
            ))}
          </FormSection>
        )}
        
        <FormSection title="Certifications">
          {certifications.map((certification, idx) => (
            <CertificationForm 
              key={idx} 
              certification={certification} 
              index={idx} 
              onUpdate={(field, value) => updateCertification(idx, field, value)}
            />
          ))}
        </FormSection>
        
        <div className="flex justify-center mt-8 mb-4 gap-3 flex-wrap">
          <button
            onClick={() => setIsAtsModalOpen(true)}
            className="btn-secondary inline-flex items-center"
          >
            <span>ATS Score Checker</span>
            <ClipboardDocumentCheckIcon className="h-5 w-5 ml-2" />
          </button>
          <button
            onClick={openModal}
            className="btn-primary inline-flex items-center animate-pulse-subtle"
          >
            <span>Analyze Placement</span>
            <QuestionMarkCircleIcon className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
      
      <JobListingsModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        resume={resume} 
      />

      <AtsCheckerModal
        isOpen={isAtsModalOpen}
        onClose={() => setIsAtsModalOpen(false)}
        resume={resume}
      />
    </>
  );
}; 