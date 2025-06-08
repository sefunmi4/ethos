import React from 'react';
import type { EnrichedPost } from '../../types/postTypes';

interface MediaPreviewProps {
  media: EnrichedPost['mediaPreviews'];
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ media }) => {
  if (!media || media.length === 0) return null;
  return (
    <div className="space-y-2">
      {media.map((m, idx) => {
        if (m.type === 'image') {
          return <img key={idx} src={m.url} alt={m.title || ''} className="max-w-full rounded" />;
        }
        if (m.type === 'video') {
          return <video key={idx} src={m.url} controls className="w-full rounded" />;
        }
        if (m.type === 'embed') {
          return (
            <iframe
              key={idx}
              src={m.url}
              title={m.title || 'embed'}
              className="w-full h-64 rounded"
            />
          );
        }
        return (
          <a key={idx} href={m.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            {m.title || m.url}
          </a>
        );
      })}
    </div>
  );
};

export default MediaPreview;
