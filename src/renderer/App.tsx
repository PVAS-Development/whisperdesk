import React from 'react';
import { AppProvider } from './contexts';
import { AppHeader, LeftPanel, RightPanel } from './components';
import { UpdateNotification } from './features/auto-update';
import './App.css';

function App(): React.JSX.Element {
  return (
    <AppProvider>
      <div className="app">
        <AppHeader />

        <main className="app-main">
          <LeftPanel />
          <RightPanel />
        </main>

        <UpdateNotification />
      </div>
    </AppProvider>
  );
}

export default App;
