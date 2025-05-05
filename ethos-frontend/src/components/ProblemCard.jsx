import React from 'react';
import ReactionButton from './ReactionButton';

const ProblemCard = ({ problem, onClick }) => {
  const { title, description, author, createdAt, reactions, id } = problem;

  return (
    <div className="problem-card" onClick={() => onClick?.(id)}>
      <div className="problem-header">
        <h3>{title}</h3>
        <span className="author">by {author?.username || 'Anonymous'}</span>
        <span className="date">{new Date(createdAt).toLocaleString()}</span>
      </div>

      <p className="problem-description">{description}</p>

      <div className="problem-actions">
        <ReactionButton type="upvote" count={reactions?.upvotes || 0} />
        <ReactionButton type="downvote" count={reactions?.downvotes || 0} />
        <ReactionButton type="comments" count={reactions?.comments || 0} />
      </div>
    </div>
  );
};

export default ProblemCard;