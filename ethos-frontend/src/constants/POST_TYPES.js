// constants/POST_TYPES.js

import { FaCommentDots, FaQuestionCircle, FaScroll, FaBullseye } from 'react-icons/fa';

/**
 * Shared list of post types with their value, label, and icon.
 * Use in forms, filters, displays, etc.
 */
export const POST_TYPES = [
    {
      value: 'free_speech',
      label: '🗣️ Free Speech',
      icon: FaCommentDots,
      description: 'General thoughts, updates, or open commentary.',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      value: 'request',
      label: '📌 Request',
      icon: FaQuestionCircle,
      description: 'Asking for help, feedback, or specific contributions.',
      color: 'bg-yellow-100 text-yellow-700',
    },
    {
      value: 'quest_log',
      label: '🧾 Quest Log',
      icon: FaScroll,
      description: 'A log or update in an ongoing quest or challenge.',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      value: 'quest_task',
      label: '🎯 Quest Task',
      icon: FaBullseye,
      description: 'A defined task or objective within a quest.',
      color: 'bg-green-100 text-green-700',
    },
  ];

/**
 * Map post type values to full config (for quick lookup)
 */
export const POST_TYPE_MAP = POST_TYPES.reduce((map, type) => {
  map[type.value] = type;
  return map;
}, {});