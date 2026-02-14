import React from 'react';
import { AppProvider } from './contexts';
import { AppHeader, LeftPanel, RightPanel } from './components';
import { ErrorBoundary } from './components/ui';
import { UpdateNotification } from './features/auto-update';
import { HttStatusIndicator, useHoldToTranscribe } from './features/hold-to-transcribe';
import './App.css';

function AppContent(): React.JSX.Element {
  const { status } = useHoldToTranscribe();

  return (
    <div className="app">
      <AppHeader />

      <main className="app-main">
        <LeftPanel />
        <RightPanel />
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
