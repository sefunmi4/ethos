import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBoardContext } from '../../contexts/BoardContext';
import Board from '../board/Board';
import PostTypeFilter from '../board/PostTypeFilter';
import { ROUTES } from '../../constants/routes';
import { BOARD_PREVIEW_LIMIT } from '../../constants/pagination';
import { getRenderableBoardItems } from '../../utils/boardUtils';

const QuestBoard: React.FC = () => {
  const { user } = useAuth();
  const { boards } = useBoardContext();
  const [postType, setPostType] = useState('');

  const questBoard = boards['quest-board'];

  const questItems = useMemo(
    () => getRenderableBoardItems(questBoard?.enrichedItems || []),
    [questBoard?.enrichedItems]
  );

  const showSeeAll = questItems.length >= BOARD_PREVIEW_LIMIT;

  const hasMultipleTypes = useMemo(() => {
    if (!questBoard?.enrichedItems?.length) return false;
    const types = new Set<string>();
    getRenderableBoardItems(questBoard.enrichedItems).forEach(item => {
      if ('type' in item) types.add(item.type as string);
    });
    return types.size > 1;
  }, [questBoard?.enrichedItems]);

  return (
    <section className="space-y-4">
      {hasMultipleTypes && (
        <PostTypeFilter value={postType} onChange={setPostType} />
      )}
      <Board
        boardId="quest-board"
        title="🗺️ Quest Board"
        layout="grid"
        gridLayout="horizontal"
        compact
        user={user}
        hideControls
        filter={postType ? { postType } : {}}
      />
      {showSeeAll && (
        <div className="text-right">
          <Link
            to={ROUTES.BOARD('quest-board')}
            className="text-blue-600 underline text-sm"
          >
            → See all
          </Link>
        </div>
      )}
    </section>
  );
};

export default QuestBoard;

