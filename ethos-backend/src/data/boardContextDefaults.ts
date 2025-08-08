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

// Default board context saved for new users
export const NEW_USER_BOARD_CONTEXT: DBBoard[] = [EMPTY_BOARD_CONTEXT];
