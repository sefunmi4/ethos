import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchReviewSummary, type ReviewSummary } from '../../../api/review';
import FeaturedQuestBoard from '../../../components/quest/FeaturedQuestBoard';
import { Spinner } from '../../../components/ui';

const ReviewSummaryPage: React.FC = () => {
  const { entityType, id } = useParams<{ entityType: string; id: string }>();
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!entityType || !id) return;
    const load = async () => {
      try {
        const data = await fetchReviewSummary(entityType, id);
        setSummary(data);
      } catch (err) {
        console.error('[ReviewSummaryPage] Failed to load summary:', err);
        setError('Failed to load review summary.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entityType, id]);

  if (loading) return <Spinner />;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold">Review Summary</h1>
      {summary && summary.count > 0 ? (
        <div className="space-y-2">
          <div>
            Average Rating: {summary.averageRating} ({summary.count} reviews)
          </div>
          <ul className="list-disc list-inside text-sm">
            {Object.entries(summary.tagCounts).map(([tag, count]) => (
              <li key={tag}>{tag}: {count as number}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No reviews yet.</p>
      )}
      <section>
        <h2 className="text-xl font-semibold mb-2">Featured Quests</h2>
        <FeaturedQuestBoard />
      </section>
    </main>
  );
};

export default ReviewSummaryPage;
