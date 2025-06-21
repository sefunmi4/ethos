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


const SummaryTag: React.FC<SummaryTagData & { className?: string }> = ({ type, label, link, className }) => {
  const Icon = icons[type] || FaStickyNote;
  const content = (
    <>
      <Icon className="w-3 h-3" />
      {label}
    </>
  );
  if (link) {
    return (
      <Link to={link} className={clsx(TAG_BASE, className)}>
        {content}
      </Link>
    );
  }
  return <span className={clsx(TAG_BASE, className)}>{content}</span>;
};

export default SummaryTag;
