import type { DBBoard } from '../types/db';

// Board context returned when no boards exist in storage
export const EMPTY_BOARD_CONTEXT: DBBoard = {
  id: 'empty-board',
  title: 'Empty Board',
  boardType: 'post',
  layout: 'grid',
  items: [],
  createdAt: new Date().toISOString(),
  userId: '',
};

// Built-in boards that should always exist
export const DEFAULT_BOARDS: DBBoard[] = [
  {
    id: 'quest-board',
    title: 'Quest Board',
    boardType: 'quest',
    layout: 'grid',
    items: [],
    createdAt: new Date().toISOString(),
    userId: '',
  },
  {
    id: 'timeline-board',
    title: 'Timeline',
    boardType: 'post',
    layout: 'grid',
    items: [],
    createdAt: new Date().toISOString(),
    userId: '',
  },
  {
    id: 'my-posts',
    title: 'My Posts',
    boardType: 'post',
    layout: 'grid',
    items: [],
    createdAt: new Date().toISOString(),
    userId: '',
  },
  {
    id: 'my-quests',
    title: 'My Quests',
    boardType: 'quest',
    layout: 'grid',
    items: [],
    createdAt: new Date().toISOString(),
    userId: '',
  },
];

// Default board context saved for new users
export const NEW_USER_BOARD_CONTEXT: DBBoard[] = DEFAULT_BOARDS;
