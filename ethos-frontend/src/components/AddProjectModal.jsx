import React, { useState } from 'react';

const AddProjectModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    title: '',
    type: 'Solo',
    link: '',
    tags: '',
    skills: '',
    visibility: 'Private',
    notes: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newProject = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()),
      skills: form.skills.split(',').map((s) => s.trim()),
    };

    try {
      // Optional: send to backend
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      const saved = await res.json();
      onAdd(saved);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Could not save project');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl p-6 shadow-xl relative">
        <h2 className="text-xl font-semibold mb-4">📦 Add a New Quest</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Project Title"
            className="w-full border rounded px-3 py-2"
            value={form.title}
            onChange={handleChange}
            required
          />

          <select
            name="type"
            className="w-full border rounded px-3 py-2"
            value={form.type}
            onChange={handleChange}
          >
            <option value="Solo">Solo</option>
            <option value="Team">Team</option>
          </select>

          <input
            type="url"
            name="link"
            placeholder="GitHub / Figma / Notion link"
            className="w-full border rounded px-3 py-2"
            value={form.link}
            onChange={handleChange}
          />

          <input
            type="text"
            name="tags"
            placeholder="Tags (e.g. web3, design)"
            className="w-full border rounded px-3 py-2"
            value={form.tags}
            onChange={handleChange}
          />

          <input
            type="text"
            name="skills"
            placeholder="Skills used (e.g. React, Writing)"
            className="w-full border rounded px-3 py-2"
            value={form.skills}
            onChange={handleChange}
          />

          <select
            name="visibility"
            className="w-full border rounded px-3 py-2"
            value={form.visibility}
            onChange={handleChange}
          >
            <option value="Private">Private</option>
            <option value="Public">Public</option>
            <option value="Team-only">Team-only</option>
          </select>

          <textarea
            name="notes"
            placeholder="What was this quest about?"
            className="w-full border rounded px-3 py-2"
            rows="3"
            value={form.notes}
            onChange={handleChange}
          />

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900"
            >
              Save Quest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal;