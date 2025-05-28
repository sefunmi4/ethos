import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import ThreadRenderer from '../renderers/ThreadRenderer';
import PostCard from '../posts/PostCard';
import { Button, PostTypeBadge } from '../ui';

const QuestCard = ({
  quest,
  logs = [],
  user,
  onJoinToggle,
  isEditing = false,
  onEdit = () => {},
  onCancel = () => {},
}) => {
  const isOwner = user?.id === quest?.authorId;
  const isJoined = quest?.collaborators?.includes(user?.id);

  const handleJoinToggle = (e) => {
    e.stopPropagation();
    onJoinToggle?.(quest);
  };

  const renderLogTimeline = () => {
    if (!logs.length) {
      return <p className="text-sm text-gray-500">No quest logs yet.</p>;
    }

    return (
      <ThreadRenderer
        rootId={logs[0]?.id}
        items={logs}
        type="timeline"
        renderItem={(log) => (
          <PostCard
            key={log.id}
            post={log}
            user={user}
            compact
            isEditing={isEditing}
            onEdit={onEdit}
            onCancel={onCancel}
          />
        )}
      />
    );
  };

  return (
    <div className="bg-white border rounded shadow-sm p-4 space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-indigo-700">{quest.title}</h2>
          <p className="text-sm text-gray-500">
            Created {formatDistanceToNow(new Date(quest.createdAt || quest.id.slice(0, 8)))} ago
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <PostTypeBadge type={quest.status || 'active'} />
          {!isOwner && (
            <Button
              size="xs"
              variant={isJoined ? 'success' : 'secondary'}
              onClick={handleJoinToggle}
            >
              {isJoined ? 'Joined' : 'Join Quest'}
            </Button>
          )}
        </div>
      </header>

      {quest.description && (
        <section>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{quest.description}</p>
        </section>
      )}

      {quest.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quest.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <section>
        <h3 className="text-md font-semibold text-gray-700 mb-2">Quest Log</h3>
        {renderLogTimeline()}
      </section>
    </div>
  );
};

export default QuestCard;