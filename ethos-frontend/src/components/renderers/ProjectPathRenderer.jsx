import React from 'react';
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
import ContributionCard from '../contribution/ContrubitionCard'; // Optional fallback

const ProjectStep = ({ step, isLast, user }) => {
  const renderContent = () => {
    return <ContributionCard item={step.content} user={user} readOnly />;
  };

  return (
    <div className="relative pl-6 border-l-4 border-blue-500">
      <div className="ml-4 mb-6 space-y-2">
        <h4 className="text-lg font-semibold text-gray-800">{step.label}</h4>
        {step.description && (
          <p className="text-sm text-gray-600">{step.description}</p>
        )}

        {renderContent()}

        <div className="flex gap-3 flex-wrap pt-2">
          {step.links?.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              {link.type === 'github' && <FaGithub className="mr-1" />}
              {link.type === 'doc' && <FaExternalLinkAlt className="mr-1" />}
              {link.label || link.url}
            </a>
          ))}
        </div>
      </div>
      {!isLast && <div className="absolute top-0 left-0 w-4 h-full bg-blue-100" />}
    </div>
  );
};

const ProjectPathRenderer = ({ project, user }) => {
  const steps = project.steps || [];

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
      <p className="text-gray-700 text-sm mb-4">{project.summary}</p>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <ProjectStep
            key={step.id || index}
            step={step}
            isLast={index === steps.length - 1}
            user={user}
          />
        ))}
      </div>

      {project.outcome && (
        <div className="mt-6 p-4 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-800 mb-1">Outcome</h4>
          <p className="text-sm text-gray-700">{project.outcome}</p>
        </div>
      )}
    </Card>
  );
};

export default ProjectPathRenderer;