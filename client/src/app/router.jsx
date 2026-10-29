import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { TasksPage } from '../pages/TasksPage';
import { TodayPage } from '../pages/TodayPage';
import { InboxPage } from '../pages/InboxPage';
import { QueryStudioPage } from '../pages/QueryStudioPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: 'dashboard',
          element: <DashboardPage />,
        },
        {
          path: 'tasks',
          element: <TasksPage />,
        },
        {
          path: 'today',
          element: <TodayPage />,
        },
        {
          path: 'inbox',
          element: <InboxPage />,
        },
        {
          path: 'query',
          element: <QueryStudioPage />,
        },
        {
          path: 'ai-planner',
          element: <Navigate to="/query" replace />,
        },
        {
          path: 'settings',
          element: <SettingsPage />,
        },
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);
