// Graph-based activity feed (simplified)

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types/userTypes';
import Board from '../board/Board';

interface RecentActivityBoardProps {
  boardId?: string;
}

const RecentActivityBoard: React.FC<RecentActivityBoardProps> = ({ boardId = 'timeline-board' }) => {
  const { user } = useAuth();

  return (
    <Board
      boardId={boardId}
      layout="list"
      title="⏳ Recent Activity"
      user={user as unknown as User}
      compact
      hideControls
      headerOnly
    />
  );
};

export default RecentActivityBoard;