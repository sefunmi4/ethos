import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fetchPostsByQuestId } from '../../api/post';
import type { Post } from '../../types/postTypes';
import GitDiffViewer from '../git/GitDiffViewer';
import ReplyThread from '../post/ReplyThread';
import { Spinner } from '../ui';

interface LineVersionThreadProps {
  questId: string;
  filePath: string;
  lineNumber: number;
  onClose?: () => void;
}

const LineVersionThread: React.FC<LineVersionThreadProps> = ({
  questId,
  filePath,
  lineNumber,
  onClose,
}) => {
  const [commits, setCommits] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const posts = await fetchPostsByQuestId(questId);
        const commitPosts = posts.filter(
          (p) => p.type === 'commit' && p.gitFilePath === filePath
        );
        setCommits(commitPosts);
      } catch (err) {
        console.error('[LineVersionThread] Failed to fetch posts', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [questId, filePath]);

  return (
    <div className="bg-surface border border-secondary rounded p-2 mt-1 space-y-3 shadow-sm">
      <div className="flex justify-between text-xs text-secondary">
        <span>History for line {lineNumber}</span>
        {onClose && (
          <button onClick={onClose} className="underline">
            Close
          </button>
        )}
      </div>
      {loading ? (
        <Spinner />
      ) : commits.length === 0 ? (
        <div className="text-xs">No history found.</div>
      ) : (
        commits.map((commit) => (
          <div key={commit.id} className="text-sm border-t border-secondary pt-2">
            <div className="flex justify-between text-xs text-secondary mb-1">
              <span>@{commit.author?.username || commit.authorId}</span>
              <span>
                {formatDistanceToNow(new Date(commit.timestamp), { addSuffix: true })}
              </span>
            </div>
            {commit.commitSummary && (
              <div className="font-semibold mb-1">{commit.commitSummary}</div>
            )}
            {commit.gitDiff && (
              <GitDiffViewer markdown={commit.gitDiff} />
            )}
            <ReplyThread postId={commit.id} />
          </div>
        ))
      )}
    </div>
  );
};

export default LineVersionThread;
