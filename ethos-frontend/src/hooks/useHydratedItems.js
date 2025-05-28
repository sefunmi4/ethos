// hooks/useHydratedItems.js
import { useEffect, useState } from 'react';
import { axiosWithAuth } from '../utils/authUtils';

/**
 * Hook to hydrate post items from IDs unless `initialItems` are already present.
 * @param {string[]} fallbackIds - Array of post IDs to hydrate if needed.
 * @param {object[]} [initialItems=[]] - Optional already enriched items (e.g., from board.enrichedItems).
 */
const useHydratedItems = (fallbackIds = [], initialItems = []) => {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    const shouldHydrate = initialItems.length === 0 && fallbackIds.length > 0;

    if (!shouldHydrate) return;

    const fetchAndHydrate = async () => {
      try {
        const res = await axiosWithAuth.get('/posts');
        const allPosts = res.data;

        const hydrated = fallbackIds
          .map(id => allPosts.find(p => p.id === id))
          .filter(Boolean); // remove not found

        setItems(hydrated);
      } catch (err) {
        console.error('[Hydration Error] Failed to load posts:', err);
      }
    };

    fetchAndHydrate();
  }, [fallbackIds.join(','), initialItems]);

  return items;
};

export default useHydratedItems;