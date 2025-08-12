import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaBookOpen,
  FaTasks,
  FaStickyNote,
  FaStar,
  FaCommentAlt,
  FaUser,
  FaHandsHelping,
  FaUserCheck,
  FaCog,
  FaBullhorn,
  FaCheckCircle,
  FaUsers,
  FaExchangeAlt
} from 'react-icons/fa';
import clsx from 'clsx';
import { TAG_BASE, TAG_TRUNCATED } from '../../constants/styles';

export type SummaryTagType =
  | 'quest'
  | 'task'
  | 'review'
  | 'type'
  | 'free_speech'
  | 'request'
  | 'change'
  | 'solved';

export interface SummaryTagData {
  type: SummaryTagType;
  label: string;
  link?: string;
  /** Optional username displayed after the label */
  username?: string;
  /** Link for the username, typically the user profile */
  usernameLink?: string;
  /** Separate link for the label itself (e.g. post detail page) */
  detailLink?: string;
  /** Whether the text should be truncated with ellipsis */
  truncate?: boolean;
}

const icons: Record<SummaryTagType, React.ComponentType<{className?: string}>> = {
  quest: FaBookOpen,
  task: FaTasks,
  review: FaStar,
  free_speech: FaCommentAlt,
  type: FaUser,
  request: FaHandsHelping,
  change: FaExchangeAlt,
  solved: FaCheckCircle,
};

const colors: Record<SummaryTagType, string> = {
  quest: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
  task: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
  log: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  review: 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-200',
  category: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200',
  status: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
  free_speech: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  type: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  request: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
  change: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
  party_request: 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-200',
  quest_task: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200',
  meta_system: 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200',
  meta_announcement: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200',
  solved: 'bg-lime-100 text-lime-800 dark:bg-lime-800 dark:text-lime-200',
};


const SummaryTag: React.FC<SummaryTagData & { className?: string }> = ({
  type,
  label,
  link,
  className,
  username,
  usernameLink,
  detailLink,
  truncate = true,
}) => {
  const Icon = icons[type] || FaStickyNote;
  const colorClass = colors[type] || colors.type;

  const baseClass = truncate ? TAG_TRUNCATED : TAG_BASE;

  if (username && usernameLink && detailLink) {
    return (
      <span className={clsx(baseClass, colorClass, className)}>
        <Icon className="w-3 h-3 flex-shrink-0" />
        <Link to={detailLink} className="underline text-inherit">
          {label}
        </Link>{' '}
        <FaUser className="w-3 h-3 flex-shrink-0" />{' '}
        <Link to={usernameLink} className="text-inherit">@{username}</Link>
      </span>
    );
  }

  const content = (
    <>
      <Icon className="w-3 h-3 flex-shrink-0" />
      {label}
    </>
  );

  if (link) {
    return (
      <Link to={link} className={clsx(baseClass, colorClass, className)}>
        {content}
      </Link>
    );
  }

  if (detailLink) {
    return (
      <Link to={detailLink} className={clsx(baseClass, colorClass, className)}>
        {content}
      </Link>
    );
  }

  return <span className={clsx(baseClass, colorClass, className)}>{content}</span>;
};

export default SummaryTag;
