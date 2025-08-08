import React, { useEffect, useState } from 'react';
import { Spinner } from '../ui';
import Select from '../ui/Select';
import { addQuest, fetchAllQuests } from '../../api/quest';
import { toTitleCase } from '../../utils/displayUtils';
import { fetchAllPosts } from '../../api/post';
import type { LinkedItem, Post, PostType } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';

interface LinkControlsProps {
  value: LinkedItem[];
  onChange: (updated: LinkedItem[]) => void;
  allowCreateNew?: boolean;
  allowNodeSelection?: boolean;
  label?: string;
  currentPostId?: string | null;
  itemTypes?: ('quest' | 'post')[];
}

const LinkControls: React.FC<LinkControlsProps> = ({
  value = [],
  onChange,
  allowCreateNew = true,
  label = 'Linked Item',
  currentPostId = null,
  itemTypes = ['quest'],
}) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [search, setSearch] = useState('');
  const [postTypeFilter, setPostTypeFilter] =
    useState<'all' | PostType>('all');
  const [sortBy, setSortBy] = useState<'label' | 'node'>('label');

  const linkTypes = [
    { value: 'solution', label: 'solution' },
    { value: 'duplicate', label: 'duplicate' },
    { value: 'related', label: 'related' },
    { value: 'quote', label: 'quote' },
    { value: 'reference', label: 'reference' },
    { value: 'task_edge', label: 'Link to parent / mark as sub-problem' },
  ];
  const linkStatuses = ['active', 'solved', 'pending', 'private'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const promises: Promise<unknown>[] = [];

      if (itemTypes.includes('quest')) promises.push(fetchAllQuests());
      if (itemTypes.includes('post')) promises.push(fetchAllPosts());

      const results = await Promise.allSettled(promises);
      let idx = 0;
      if (itemTypes.includes('quest')) {
        const questRes = results[idx++];
        if (questRes.status === 'fulfilled') {
          const list = (questRes.value as Quest[]) || [];
          setQuests(list);
        }
      }
      if (itemTypes.includes('post')) {
        const postRes = results[idx++];
        if (postRes.status === 'fulfilled') {
          const list = (postRes.value || []) as Post[];
          setPosts(list);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [itemTypes]);

  const handleLinkSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [type, id] = e.target.value.split(':');
    const alreadyLinked = value.find(
      v => v.itemId === id && v.itemType === (type as 'quest' | 'post')
    );
    if (!alreadyLinked) {
      let header = '';
      if (type === 'post') {
        const p = posts.find((x) => x.id === id);
        const text = p?.content.trim() || '';
        // TODO: replace simple truncation with AI-generated summaries
        header = text.length <= 50 ? text : text.slice(0, 50) + '…';
      }
      onChange([
        ...value,
        {
          itemId: id,
          itemType: type as 'quest' | 'post',
          nodeId: '',
          title: header,
          linkType: 'related',
          linkStatus: 'active',
          cascadeSolution: false,
          notifyOnChange: false,
        },
      ]);
    }
  };

  const handleUnlink = (item: LinkedItem) => {
    onChange(value.filter((v) => v.itemId !== item.itemId || v.itemType !== item.itemType));
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const created = await addQuest({ title: newTitle, fromPostId: currentPostId || undefined });
    const newLink: LinkedItem = {
      itemId: created.id,
      itemType: 'quest',
      nodeId: '',
      linkType: 'related',
      linkStatus: 'active',
      cascadeSolution: false,
      notifyOnChange: false,
    };
    setQuests((prev) => [...prev, created]);
    onChange([...value, newLink]);
    setNewTitle('');
    setCreating(false);
  };

  const handleUpdate = (idx: number, key: keyof LinkedItem, val: unknown) => {
    const updated = [...value];
    updated[idx] = { ...updated[idx], [key]: val };
    onChange(updated);
  };

  const handleToggle = (idx: number, key: keyof LinkedItem) => {
    const updated = [...value];
    updated[idx] = { ...updated[idx], [key]: !updated[idx][key] };
    onChange(updated);
  };

  const filteredPosts = posts.filter(
    (p) => postTypeFilter === 'all' || p.type === postTypeFilter
  );
  type Option = { value: string; label: string; nodeId?: string; type?: string };
  const allOptions: Option[] = [
    ...(itemTypes.includes('quest')
      ? quests.map((q) => ({
          value: `quest:${q.id}`,
          label: `🧭 Quest: ${toTitleCase(q.title)}`,
          nodeId: q.title,
          type: 'quest',
        }))
      : []),
    ...(itemTypes.includes('post')
      ? filteredPosts.map((p) => ({
          value: `post:${p.id}`,
          label: `${p.content.slice(0, 30)} - ${p.nodeId || p.type}`,
          nodeId: p.nodeId,
          type: p.type,
        }))
      : []),
  ];
  const filtered = allOptions.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.nodeId || '').toLowerCase().includes(search.toLowerCase()) ||
      o.value.includes(search)
  );
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'node') return (a.nodeId || '').localeCompare(b.nodeId || '');
    return a.label.localeCompare(b.label);
  });

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      ) : (
        <> 
          {itemTypes.includes('post') && (
            <div className="flex gap-1 mb-1 flex-wrap">
              {['all', 'free_speech', 'request', 'project', 'quest', 'task', 'change', 'review'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setPostTypeFilter(t as 'all' | PostType)
                  }
                  className={`text-xs px-2 py-0.5 rounded ${
                    postTypeFilter === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="border rounded px-2 py-1 text-sm w-full"
          />
          <div className="flex items-center gap-2 my-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'label' | 'node')}
              className="border rounded px-1 py-0.5 text-xs"
            >
              <option value="label">Title</option>
              <option value="node">Node ID</option>
            </select>
          </div>
          <Select
            value=""
            onChange={handleLinkSelect}
            options={[
              { value: '', label: `-- Select ${label} --`, disabled: true },
              ...sorted,
            ]}
          />

          {allowCreateNew && itemTypes.includes('quest') && !creating && (
            <button
              type="button"
              className="text-blue-600 text-xs underline"
              onClick={() => setCreating(true)}
            >
              + Create new quest
            </button>
          )}

          {creating && itemTypes.includes('quest') && (
            <div className="flex gap-2 items-center mt-2">
              <input
                type="text"
                className="border rounded px-2 py-1 text-sm"
                placeholder="New quest title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button
                type="button"
                className="text-xs bg-indigo-600 text-white px-3 py-1 rounded"
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          )}

          {value.map((item, idx) => (
            <div key={idx} className="p-2 border rounded space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  🔗 {item.itemType}: {item.itemId}
                  {item.nodeId && ` (${item.nodeId})`}
                </span>
                <button
                  type="button"
                  onClick={() => handleUnlink(item)}
                  className="text-red-500 text-xs underline"
                >
                  Unlink
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="text-gray-600 dark:text-gray-400">Type:</label>
                <select
                  value={item.linkType || 'related'}
                  onChange={(e) => handleUpdate(idx, 'linkType', e.target.value)}
                  className="border rounded px-1 py-0.5"
                >
                  {linkTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                <label className="text-gray-600 dark:text-gray-400">Status:</label>
                <select
                  value={item.linkStatus || 'active'}
                  onChange={(e) => handleUpdate(idx, 'linkStatus', e.target.value)}
                  className="border rounded px-1 py-0.5"
                >
                  {linkStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <label className="text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={item.cascadeSolution || false}
                    onChange={() => handleToggle(idx, 'cascadeSolution')}
                  /> 🔁 Cascade
                </label>

                <label className="text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={item.notifyOnChange || false}
                    onChange={() => handleToggle(idx, 'notifyOnChange')}
                  /> 🔔 Notify
                </label>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400">Header</label>
                <input
                  type="text"
                  className="border rounded px-1 py-0.5 text-xs w-full"
                  value={item.title || ''}
                  onChange={(e) => handleUpdate(idx, 'title', e.target.value)}
                />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default LinkControls;
