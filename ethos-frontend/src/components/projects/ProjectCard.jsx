import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../contribution/ContrubitionCard';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';

const ProjectCard = ({ project, quests = [], members = [], compact = false }) => {
  const navigate = useNavigate();

  const goToProject = () => navigate(`/project/${project.id}`);

  return (
    <Card onClick={goToProject} className="cursor-pointer hover:shadow-lg transition-all">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-indigo-700 mb-1">
            {project.title || 'Untitled Project'}
          </h2>
          {project.summary && (
            <p className="text-gray-600 text-sm line-clamp-3 mb-2">
              {project.summary}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {project.tags?.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Updated {formatDistanceToNow(new Date(project.updatedAt || project.createdAt))} ago
          </div>
        </div>

        <div className="ml-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            navigate(`/project/${project.id}/edit`);
          }}>
            Edit
          </Button>
        </div>
      </div>

      {!compact && quests?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Linked Quests</h4>
          <ul className="text-sm text-gray-600 list-disc list-inside">
            {quests.map((q) => (
              <li key={q.id}>{q.title}</li>
            ))}
          </ul>
        </div>
      )}

      {!compact && members?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Team Members</h4>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <span
                key={m.id}
                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
              >
                @{m.username || m.displayName || m.id.slice(0, 6)}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProjectCard;
