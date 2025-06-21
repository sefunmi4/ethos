import React, { useState, useEffect } from 'react';

interface TaskTemplate {
  id: string;
  name: string;
  tag: string;
  points: number;
}

const STORAGE_KEY = 'task-library';

const TaskLibrary: React.FC = () => {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch {
        setTasks([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!name.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), name: name.trim(), tag: tag.trim(), points }]);
    setName('');
    setTag('');
    setPoints(0);
  };

  const updateTask = (id: string, field: keyof TaskTemplate, value: string | number) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, [field]: value } : t)));
  };

  return (
    <main className="container mx-auto max-w-2xl p-4 space-y-6">
      <h1 className="text-xl font-semibold">Task Library</h1>
      <div className="space-y-2">
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="Task name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="Tag"
          value={tag}
          onChange={e => setTag(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 w-full"
          type="number"
          placeholder="Points"
          value={points}
          onChange={e => setPoints(parseInt(e.target.value) || 0)}
        />
        <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={addTask}>
          Add Task
        </button>
      </div>
      <ul className="space-y-3">
        {tasks.map(t => (
          <li key={t.id} className="border rounded p-3 space-y-2">
            <input
              className="border rounded px-2 py-1 w-full"
              value={t.name}
              onChange={e => updateTask(t.id, 'name', e.target.value)}
            />
            <input
              className="border rounded px-2 py-1 w-full"
              value={t.tag}
              onChange={e => updateTask(t.id, 'tag', e.target.value)}
            />
            <input
              className="border rounded px-2 py-1 w-full"
              type="number"
              value={t.points}
              onChange={e => updateTask(t.id, 'points', parseInt(e.target.value) || 0)}
            />
          </li>
        ))}
      </ul>
    </main>
  );
};

export default TaskLibrary;
