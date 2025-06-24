import React, { useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { addReview, updateReview } from '../api/review';
import { Button, Input, TextArea, Label, FormSection, Select } from './ui';
import { VISIBILITY_OPTIONS, REVIEW_STATUS_OPTIONS } from '../constants/options';
import type { ReviewTargetType, Review } from '../types/reviewTypes';

interface ReviewFormProps {
  reviewId?: string;
  targetType: ReviewTargetType;
  questId?: string;
  postId?: string;
  repoUrl?: string;
  modelId?: string;
  onSubmitted?: (review: Review) => void;
  initialRating?: number;
  initialTags?: string[];
  initialFeedback?: string;
  initialVisibility?: 'private' | 'public';
  initialStatus?: 'draft' | 'submitted' | 'accepted';
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  reviewId,
  targetType,
  questId,
  postId,
  repoUrl,
  modelId,
  onSubmitted,
  initialRating = 0,
  initialTags = [],
  initialFeedback = '',
  initialVisibility = 'public',
  initialStatus = 'submitted',
}) => {
  const [rating, setRating] = useState(initialRating);
  const [tags, setTags] = useState(initialTags.join(', '));
  const [feedback, setFeedback] = useState(initialFeedback);
  const [visibility, setVisibility] = useState<'public' | 'private'>(initialVisibility);
  const [status, setStatus] = useState<'draft' | 'submitted' | 'accepted'>(initialStatus);
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
      const payload = {
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
        visibility,
        status,
      };
      const review = reviewId
        ? await updateReview(reviewId, payload)
        : await addReview(payload);
      setRating(0);
      setTags('');
      setFeedback('');
      setVisibility('public');
      setStatus('submitted');
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
          {[1, 2, 3, 4, 5].map((n) => {
            const full = rating >= n;
            const half = !full && rating >= n - 0.5;
            return (
              <button
                type="button"
                key={n}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const isHalf = e.clientX - rect.left < rect.width / 2;
                  setRating(isHalf ? n - 0.5 : n);
                }}
                className="text-2xl focus:outline-none text-yellow-400"
              >
                {full ? <FaStar /> : half ? <FaStarHalfAlt /> : <FaRegStar />}
              </button>
            );
          })}
        </div>
      </FormSection>
      <FormSection title="Visibility">
        <Select
          value={visibility}
          onChange={e => setVisibility(e.target.value as 'public' | 'private')}
          options={VISIBILITY_OPTIONS.slice()}
        />
      </FormSection>
      <FormSection title="Status">
        <Select
          value={status}
          onChange={e => setStatus(e.target.value as 'draft' | 'submitted' | 'accepted')}
          options={REVIEW_STATUS_OPTIONS.slice()}
        />
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
