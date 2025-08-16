import { pool, usePg } from '../db';
import type { DBPost } from '../types/db';

/**
 * Attach approved collaborator counts to each post.
 * Falls back to using the collaborators array when a DB is not available.
 */
export const addApprovedCollaboratorsCount = async <T extends Pick<DBPost, 'id' | 'type' | 'collaborators'> & { [key: string]: any }>(posts: T[]): Promise<T[]> => {
  if (!posts || posts.length === 0) return posts;

  const targetIds = posts
    .filter(p => p.type === 'task' || p.type === 'request')
    .map(p => p.id);

  if (usePg && targetIds.length > 0) {
    try {
      const result = await pool.query(
        `SELECT task_id, COUNT(*) AS count
         FROM task_join_requests
         WHERE task_id = ANY($1::text[]) AND status = 'APPROVED'
         GROUP BY task_id`,
        [targetIds]
      );
      const countMap: Record<string, number> = {};
      for (const row of result.rows) {
        const id = row.task_id || row.taskid || row.id;
        countMap[id] = Number(row.count) || 0;
      }
      return posts.map(p => ({
        ...p,
        approvedCollaboratorsCount: countMap[p.id] || 0,
      }));
    } catch (err) {
      console.error('Error fetching collaborator counts', err);
      // Fall back to zero counts on error
      return posts.map(p => ({
        ...p,
        approvedCollaboratorsCount: 0,
      }));
    }
  }

  // Fallback for memory store: count filled collaborator slots
  return posts.map(p => ({
    ...p,
    approvedCollaboratorsCount: (p.collaborators || []).filter(c => c.userId).length,
  }));
};

export default addApprovedCollaboratorsCount;
