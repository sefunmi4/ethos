import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

import { ROUTES } from './constants/routes';
import { AuthProvider } from './contexts/AuthContext';
import { BoardProvider } from './contexts/BoardContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/queryClient';
import { TimelineProvider } from './contexts/TimelineContext';

import NavBar from './components/ui/NavBar';
import PrivateRoute from './routes/ProtectedRoute';

/**
 * Lazy-loaded pages to improve initial load time by code-splitting.
 * These components are only fetched when their routes are accessed.
 */
const Home = lazy(() => import('./pages/index'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Quest = lazy(() => import('./pages/quest/[id]'));
const Post = lazy(() => import('./pages/post/[id]'));
const Board = lazy(() => import('./pages/board/[id]'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

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
            <div className="min-h-screen flex flex-col bg-white text-gray-900">
              {/* Top-level navigation */}
              <NavBar />

              <main className="flex-1 w-full">
                {/* Suspense fallback while lazy routes are loading */}
                <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
                  <Routes>
                  {/* ✅ Publicly accessible routes */}
                  <Route path={ROUTES.HOME} element={<Home />} />
                  <Route path={ROUTES.LOGIN} element={<Login />} />
                  <Route path={ROUTES.PUBLIC_PROFILE()} element={<PublicProfile />} />
                  <Route path={ROUTES.RESET_PASSWORD()} element={<ResetPassword />} />

                  {/* 🔒 Routes requiring authentication (wrapped in PrivateRoute) */}
                  <Route element={<PrivateRoute />}>
                    <Route path={ROUTES.PROFILE} element={<Profile />} />
                    <Route path={ROUTES.QUEST()} element={<Quest />} />
                    <Route path={ROUTES.POST()} element={<Post />} />
                    <Route path={ROUTES.BOARD()} element={<Board />} />
                  </Route>

                  {/* 🔁 Catch-all route for unmatched URLs */}
                  <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
          </BoardProvider>
        </TimelineProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

export default App;