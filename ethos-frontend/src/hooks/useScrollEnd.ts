import { useEffect, useRef } from 'react';

/**
 * Hook to trigger a callback when a scrollable element reaches the end.
 *
 * @param callback Function invoked when the element is scrolled near the bottom.
 * @param offset   Distance from the bottom before triggering the callback.
 * @returns        A ref to attach to the scrollable element.
 */
export const useScrollEnd = <T extends HTMLElement>(
  callback?: () => void,
  offset = 150
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !callback) return;
    const handle = () => {
      if (el.scrollHeight - el.scrollTop <= el.clientHeight + offset) {
        callback();
      }
    };
    el.addEventListener('scroll', handle);
    return () => el.removeEventListener('scroll', handle);
  }, [callback, offset]);

  return ref;
};

export default useScrollEnd;
