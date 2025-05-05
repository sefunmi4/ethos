import React from 'react';

const ProjectCard = ({ project }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition">
      {/* Project Title */}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        {project.title}
      </h3>

      {/* Metadata */}
      <div className="text-sm text-gray-500 mb-2 flex flex-wrap gap-2">
        <span className="inline-block bg-gray-100 px-2 py-0.5 rounded-full">
          {project.type || 'Solo'}
        </span>
        <span className="inline-block bg-gray-100 px-2 py-0.5 rounded-full">
          {project.visibility}
        </span>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View Resource ↗
          </a>
        )}
      </div>

      {/* Tags */}
      <div className="mb-2 flex flex-wrap gap-2">
        {project.tags?.map((tag, idx) => (
          <span
            key={idx}
            className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Skills */}
      <div className="mb-3 flex flex-wrap gap-2">
        {project.skills?.map((skill, idx) => (
          <span
            key={idx}
            className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Notes or Description */}
      {project.notes && (
        <p className="text-sm text-gray-600 line-clamp-3">
          {project.notes}
        </p>
      )}

      {/* Timestamp */}
      {project.createdAt && (
        <p className="text-xs text-gray-400 mt-3">
          Added {new Date(project.createdAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default ProjectCard;