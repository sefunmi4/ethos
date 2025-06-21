import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaBookOpen,
  FaTasks,
  FaBug,
  FaStickyNote,
  FaStar,
  FaCommentAlt,
  FaUser
} from 'react-icons/fa';
import clsx from 'clsx';
import { TAG_BASE } from '../../constants/styles';

export type SummaryTagType =
  | 'quest'
  | 'task'
  | 'issue'
  | 'log'
  | 'review'
  | 'category'
  | 'status'
  | 'free_speech'
  | 'type';

export interface SummaryTagData {
  type: SummaryTagType;
  label: string;
  link?: string;
}

const icons: Record<SummaryTagType, React.ComponentType<{className?: string}>> = {
  quest: FaBookOpen,
  task: FaTasks,
  issue: FaBug,
  log: FaStickyNote,
  review: FaStar,
  category: FaStickyNote,
  status: FaStickyNote,
  free_speech: FaCommentAlt,
  type: FaUser,
};

const colors: Record<SummaryTagType, string> = {
  quest: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
  task: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
  issue: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
  log: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  review: 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-200',
  category: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200',
  status: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200',
  free_speech: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  type: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};


const SummaryTag: React.FC<SummaryTagData & { className?: string }> = ({ type, label, link, className }) => {
  const Icon = icons[type] || FaStickyNote;
  const colorClass = colors[type] || colors.type;
  const content = (
    <>
      <Icon className="w-3 h-3" />
      {label}
    </>
  );
  if (link) {
    return (
      <Link to={link} className={clsx(TAG_BASE, colorClass, className)}>
        {content}
      </Link>
    );
  }
  return <span className={clsx(TAG_BASE, colorClass, className)}>{content}</span>;
};

export default SummaryTag;
