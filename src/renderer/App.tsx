import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts';
import { useAppHistory, useAppTranscription } from './contexts';
import { AppHeader } from './components/layout/AppHeader';
import { TabBar } from './components/layout/TabBar';
import { TranscribeTab } from './components/layout/TranscribeTab';
import { SettingsTab } from './components/layout/SettingsTab';
import { HistoryTab } from './components/layout/HistoryTab';
import { ErrorBoundary } from './components/ui';
import { UpdateNotification } from './features/auto-update';
import { HttStatusIndicator, useHoldToTranscribe } from './features/hold-to-transcribe';
import type { TabId } from './components/layout/TabBar';
import './App.css';

function AppContent(): React.JSX.Element {
  const { status } = useHoldToTranscribe();
  const { isTranscribing } = useAppTranscription();
  const { history, showHistory, setShowHistory } = useAppHistory();
  const [activeTab, setActiveTab] = useState<TabId>('transcribe');

  // Sync Cmd+H menu shortcut (toggles showHistory) → tab
  useEffect(() => {
    if (showHistory && activeTab !== 'history') {
      setActiveTab('history');
    } else if (!showHistory && activeTab === 'history') {
      setActiveTab('transcribe');
    }
  }, [showHistory, activeTab]);

  const handleTabChange = (tab: TabId): void => {
    setActiveTab(tab);
    setShowHistory(tab === 'history');
  };

  return (
    <div className="app">
      <AppHeader />
      <TabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isTranscribing={isTranscribing}
        historyCount={history.length}
      />

      <main className="app-main">
        {activeTab === 'transcribe' && <TranscribeTab />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'history' && <HistoryTab onSwitchTab={handleTabChange} />}
      </main>

      <UpdateNotification />
      <HttStatusIndicator status={status} />
    </div>
  );
}

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export { App };
