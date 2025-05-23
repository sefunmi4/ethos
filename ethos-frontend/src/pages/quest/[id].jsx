import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BoardProvider } from '../../contexts/BoardContext';
import QuestSummaryHeader from '../../components/quests/QuestSummaryHeader';
import QuestBoardMap from '../../components/quests/QuestBoardMap';
import Board from '../../components/boards/Board';
import BoardToolbar from '../../components/boards/BoardToolbar';
import axios from 'axios';

const QuestPage = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const [quest, setQuest] = useState(null);
  const [questLogs, setQuestLogs] = useState([]);
  const [error, setError] = useState(null);

  const fetchQuestData = useCallback(async () => {
    try {
      const questRes = await axios.get(`/api/quests/${id}`);
      const logsRes = await axios.get(`/api/quests/${id}/logs`);

      const fetchedQuest = questRes.data;
      const logs = logsRes?.data?.logs || fetchedQuest.logs || [];

      setQuest(fetchedQuest);
      setQuestLogs(logs);
    } catch (err) {
      setError('Failed to load quest.');
      console.error('[QuestPage Error]', err);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestData();
  }, [fetchQuestData]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-500">Checking session...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!quest) {
    return <div className="text-center py-12 text-gray-500">Loading quest...</div>;
  }

  return (
    <BoardProvider initialStructure="list">
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <QuestSummaryHeader quest={quest} onRefresh={fetchQuestData} />

        <section className="mt-10 mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">📓 Quest Log</h2>
          <BoardToolbar title="Timeline & Chat" filters={{ type: 'quest_log' }} />
          <Board
            board={{
              id: `quest-log-${quest.id}`,
              title: 'Quest Log',
              items: questLogs
            }}
            structure="list"
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🗺️ Quest Map</h2>
          <QuestBoardMap quest={quest} logs={questLogs} />
        </section>
      </main>
    </BoardProvider>
  );
};

export default QuestPage;