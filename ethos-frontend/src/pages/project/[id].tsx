import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../../hooks/useProject';
import { fetchPostById } from '../../api/post';
import { Spinner } from '../../components/ui';
import type { Post } from '../../types/postTypes';

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { project, error, isLoading } = useProject(id ?? '');
  const [deliverables, setDeliverables] = useState<Post[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!project) return;
      const posts = await Promise.all(
        (project.deliverables || []).map((pid: string) =>
          fetchPostById(pid).catch(() => null),
        ),
      );
      setDeliverables(posts.filter(Boolean));
    };
    load();
  }, [project]);

  if (error) {
    return <div className="p-6 text-center text-red-500">Project not found.</div>;
  }
  if (isLoading || !project) return <Spinner />;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12 bg-soft dark:bg-soft-dark text-primary">
      <h1 className="text-2xl font-bold">{project.title}</h1>
      <p>{project.description}</p>

      <section>
        <h2 className="text-xl font-semibold mb-4">Project Map</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded">
          {JSON.stringify(project.mapEdges || [], null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Deliverables</h2>
        {deliverables.length > 0 ? (
          deliverables.map((p) => (
            <div key={p.id} className="border p-2 mb-2 rounded">
              {p.title || p.id}
            </div>
          ))
        ) : (
          <p className="text-sm text-secondary">No deliverables yet.</p>
        )}
      </section>
    </main>
  );
};

export default ProjectPage;
