import React, { useState } from 'react';
import type { Post } from '../../types/postTypes';
import { Button, AvatarStack, SummaryTag } from '../ui';
import { POST_TYPE_LABELS, toTitleCase } from '../../utils/displayUtils';
import { getRank } from '../../utils/rankUtils';
import { FaUserPlus, FaUserCheck } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { acceptRequest, unacceptRequest } from '../../api/post';
import { ROUTES } from '../../constants/routes';

const RANK_ORDER: Record<string, number> = { E: 0, D: 1, C: 2, B: 3, A: 4, S: 5 };

interface RequestCardProps {
  post: Post;
  onUpdate?: (post: Post) => void;
  className?: string;
}

const RequestCard: React.FC<RequestCardProps> = ({ post, onUpdate, className }) => {
  const { user } = useAuth();
  const collaboratorUsers = (post as any).enrichedCollaborators || [];
  const collaboratorCount = collaboratorUsers.filter((c: any) => c.userId).length || 0;
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(
    !!user && post.tags?.includes(`pending:${user.id}`)
  );

  const rankTag = post.tags?.find(t => t.toLowerCase().startsWith('min_rank:'));
  const roleTag = post.tags?.find(t => t.toLowerCase().startsWith('role:'));
  const difficultyTag = post.tags?.find(t => t.toLowerCase().startsWith('difficulty:'));
  const minRank = rankTag ? rankTag.split(':')[1] : undefined;
  const role = roleTag ? roleTag.split(':')[1] : undefined;
  const difficulty = difficultyTag ? difficultyTag.split(':')[1] : undefined;
  const userRank = getRank(user?.xp ?? 0);

  const handleJoin = async () => {
    if (!user) return;
    try {
      setJoining(true);
      if (joined) {
        const res = await unacceptRequest(post.id);
        onUpdate?.(res.post);
        setJoined(false);
      } else {
        const res = await acceptRequest(post.id);
        onUpdate?.(res.post);
        setJoined(true);
      }
    } catch (err) {
      console.error('[RequestCard] Failed to join:', err);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      className={
        'border border-secondary rounded bg-surface p-4 space-y-2 w-72 flex-shrink-0 ' +
        (className || '')
      }
    >
      <div className="flex items-center gap-2 text-sm text-secondary">
        {post.questId ? (
          <SummaryTag
            type="quest_task"
            label={post.nodeId && /:T00$/.test(post.nodeId) ? 'Quest' : 'Quest Task'}
          />
        ) : (
          <SummaryTag type="request" label={POST_TYPE_LABELS.request} />
        )}
        {post.nodeId && (
          <SummaryTag
            type={post.type === 'issue' || post.subtype === 'issue' ? 'issue' : 'task'}
            label={post.nodeId.replace(/^Q:[^:]+:/, '')}
            detailLink={ROUTES.POST(post.id)}
          />
        )}
        {post.questId && (
          <SummaryTag
            type="quest"
            label={post.questNodeTitle || post.questTitle || 'Quest'}
          />
        )}
      </div>
      {post.title && (
        <h3 className="font-semibold text-lg truncate">{toTitleCase(post.title)}</h3>
      )}
      {post.content && <p className="text-sm text-primary">{post.content}</p>}
      <div className="flex items-center gap-2 text-xs text-secondary">
        <AvatarStack users={collaboratorUsers} />
        <span>{collaboratorCount} collaborators</span>
      </div>
      {(role || minRank || difficulty) && (
        <div className="text-xs text-secondary space-y-0.5">
          {role && <div>Required Role: {role}</div>}
          {minRank && <div>Min Rank: {minRank}</div>}
          {difficulty && <div>Difficulty: {difficulty}</div>}
          {minRank && RANK_ORDER[userRank] < (RANK_ORDER[minRank] ?? 0) && (
            <div className="text-red-500">Your rank {userRank} is below requirement.</div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={handleJoin} disabled={joining}>
          {joining ? (
            '...'
          ) : joined ? (
            <><FaUserCheck className="inline mr-1" /> Joined</>
          ) : (
            <><FaUserPlus className="inline mr-1" /> {post.questId && role ? 'Join' : 'Accept'}</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default RequestCard;
