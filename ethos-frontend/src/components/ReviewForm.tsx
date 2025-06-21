import React, { useState } from 'react';
import { addReview } from '../api/review';
import { Button, Input, TextArea, Label, FormSection } from './ui';
import type { ReviewTargetType, Review } from '../types/reviewTypes';

interface ReviewFormProps {
  targetType: ReviewTargetType;
  questId?: string;
  postId?: string;
  repoUrl?: string;
  modelId?: string;
  onSubmitted?: (review: Review) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  targetType,
  questId,
  postId,
  repoUrl,
  modelId,
  onSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!rating) {
      setError('Rating is required');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const review = await addReview({
        targetType,
        rating,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        feedback,
        questId,
        postId,
        repoUrl,
        modelId,
      });
      setRating(0);
      setTags('');
      setFeedback('');
      onSubmitted?.(review);
    } catch (err: unknown) {
      console.error('[ReviewForm] Failed to submit review:', err);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to submit review.';
      setError(msg);
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Rating">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className={
                'text-2xl focus:outline-none ' +
                (rating >= n
                  ? 'text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600')
              }
            >
              ★
            </button>
          ))}
        </div>
      </FormSection>
      <FormSection title="Tags">
        <Label htmlFor="review-tags">Comma-separated Tags</Label>
        <Input
          id="review-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. helpful, inspiring"
        />
      </FormSection>
      <FormSection title="Feedback">
        <Label htmlFor="review-feedback">Feedback</Label>
        <TextArea
          id="review-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts"
        />
      </FormSection>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        {/* Use contrast styling so the button is dark in light mode and light in dark mode */}
        <Button type="submit" variant="contrast" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
