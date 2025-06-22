import React, { Suspense, lazy } from 'react';
import { Spinner } from './components/ui';
import { Routes, Route, Navigate } from 'react-router-dom';

import { ROUTES } from './constants/routes';
import { AuthProvider } from './contexts/AuthContext';
import { BoardProvider } from './contexts/BoardContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/queryClient';
import { TimelineProvider } from './contexts/TimelineContext';
import { ThemeProvider } from './contexts/ThemeContext';

import NavBar from './components/ui/NavBar';
import Footer from './components/ui/Footer';
import PrivateRoute from './routes/ProtectedRoute';

/**
 * Lazy-loaded pages to improve initial load time by code-splitting.
 * These components are only fetched when their routes are accessed.
 */
const Home = lazy(() => import('./pages/index'));
const Login = lazy(() => import('./pages/Login'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Profile = lazy(() => import('./pages/Profile'));
const Quest = lazy(() => import('./pages/quest/[id]'));
const Post = lazy(() => import('./pages/post/[id]'));
const Board = lazy(() => import('./pages/board/[id]'));
const BoardType = lazy(() => import('./pages/board/[boardType]'));
const TeamBoard = lazy(() => import('./pages/board/team-[questId]'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const FlaggedQuests = lazy(() => import('./pages/admin/FlaggedQuests'));
const BannedQuests = lazy(() => import('./pages/admin/BannedQuests'));

/**
 * The root App component of the application.
 * Wraps the entire UI in required context providers for:
 * - Authentication (`AuthProvider`)
 * - React Query (`QueryClientProvider`)
 * - Board context for collaborative features (`BoardProvider`)
 *
 * Sets up routing using `react-router-dom` and defers page loading
 * using `React.Suspense` with dynamic imports.
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TimelineProvider>
          <BoardProvider>
            <ThemeProvider>
            <div className="min-h-screen flex flex-col bg-background dark:bg-surface text-primary">
              {/* Top-level navigation */}
              <NavBar />

              <main className="flex-1 w-full">
                {/* Suspense fallback while lazy routes are loading */}
                <Suspense fallback={<Spinner />}>
                  <Routes>
                  {/* ✅ Publicly accessible routes */}
                  <Route path={ROUTES.HOME} element={<Home />} />
                  <Route path={ROUTES.LOGIN} element={<Login />} />
                  <Route path={ROUTES.ABOUT} element={<About />} />
                  <Route path={ROUTES.PRIVACY} element={<Privacy />} />
                  <Route path={ROUTES.TERMS} element={<Terms />} />
                  <Route path={ROUTES.PUBLIC_PROFILE()} element={<PublicProfile />} />
                  <Route path={ROUTES.RESET_PASSWORD()} element={<ResetPassword />} />

                  {/* 🔒 Routes requiring authentication (wrapped in PrivateRoute) */}
                  <Route element={<PrivateRoute />}>
                  <Route path={ROUTES.PROFILE} element={<Profile />} />
                  <Route path={ROUTES.QUEST()} element={<Quest />} />
                    <Route path={ROUTES.POST()} element={<Post />} />
                    <Route path="/board/quests" element={<Navigate to={ROUTES.BOARD('quest-board')} replace />} />
                    <Route path={ROUTES.BOARD()} element={<Board />} />
                    <Route path={ROUTES.TEAM_BOARD()} element={<TeamBoard />} />
                    <Route path={ROUTES.BOARD_TYPE()} element={<BoardType />} />
                    <Route path={ROUTES.FLAGGED_QUESTS} element={<FlaggedQuests />} />
                    <Route path={ROUTES.BANNED_QUESTS} element={<BannedQuests />} />
                  </Route>

                  {/* 🔁 Catch-all route for unmatched URLs */}
                  <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            </div>
            </ThemeProvider>
          </BoardProvider>
        </TimelineProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

export default App;