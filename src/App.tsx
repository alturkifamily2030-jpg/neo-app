import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { NotificationProvider } from './context/NotificationContext';
import { ComplyProvider } from './context/ComplyContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import FixPage from './pages/FixPage';
import GroupPage from './pages/GroupPage';
import AreaPage from './pages/AreaPage';
import PlanPage from './pages/PlanPage';
import AssetsPage from './pages/AssetsPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import PlannedTaskPage from './pages/PlannedTaskPage';
import AssetPage from './pages/AssetPage';
import ChannelPage from './pages/ChannelPage';
import UserPage from './pages/UserPage';
import DashboardDetailPage from './pages/DashboardDetailPage';
import TaskPage from './pages/TaskPage';
import ComplyPage from './pages/ComplyPage';
import ChecklistRunPage from './pages/ChecklistRunPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <NotificationProvider>
    <ComplyProvider>
    <BrowserRouter>
      <AppLayout onLogout={() => setIsLoggedIn(false)}>
        <Routes>
          <Route path="/" element={<Navigate to="/fix" replace />} />
          <Route path="/fix" element={<FixPage />} />
          <Route path="/fix/group/:id" element={<GroupPage />} />
          <Route path="/fix/area/:id" element={<AreaPage />} />
          <Route path="/fix/task/:id" element={<TaskPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/plan/:id" element={<PlannedTaskPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/assets/:id" element={<AssetPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ChannelPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/:id" element={<DashboardDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<UserPage />} />
          <Route path="/comply" element={<ComplyPage />} />
          <Route path="/comply/run/:id" element={<ChecklistRunPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/fix" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
    </ComplyProvider>
    </NotificationProvider>
  );
}
