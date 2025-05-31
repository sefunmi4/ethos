// src/pages/project/[id].jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { axiosWithAuth } from '../../utils/authUtils';
import { useAuth } from '../../contexts/AuthContext';
import ProjectCard from '../../components/projects/ProjectCard';
import PostCard from '../../components/posts/PostCard';
import CreateContribution from '../../components/contribution/CreateContribution';

const ProjectPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const [projectRes, postsRes] = await Promise.all([
          axiosWithAuth.get(`/api/projects/${id}`),
          axiosWithAuth.get(`/api/posts/project/${id}`)
        ]);

        setProject(projectRes.data);
        setPosts(postsRes.data || []);
      } catch (err) {
        console.error('Failed to load project:', err);
        setError('This project could not be loaded or is private.');
      }
    };

    fetchProjectData();
  }, [id]);

  const handleNewPost = (newPost) => {
    setPosts([newPost, ...posts]);
    setShowCreate(false);
  };

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!project) {
    return <div className="p-6 text-center text-gray-500">Loading project...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Project Header */}
      <ProjectCard project={project} user={user} readOnly />

      {/* Linked Posts */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">📁 Project Updates</h2>
          {user && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showCreate ? 'Cancel' : '+ Add Update'}
            </button>
          )}
        </div>

        {showCreate && (
          <div className="border rounded p-4 bg-white shadow">
            <CreateContribution
              typeOverride="post"
              boards={[]}
              onSave={handleNewPost}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} user={user} compact />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No updates yet. Start tracking project progress.</p>
        )}
      </section>
    </main>
  );
};

export default ProjectPage;
