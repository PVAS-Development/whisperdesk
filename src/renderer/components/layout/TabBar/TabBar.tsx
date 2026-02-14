import React from 'react';
import { Mic, Settings, History } from 'lucide-react';
import './TabBar.css';

export type TabId = 'transcribe' | 'settings' | 'history';

export interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isTranscribing: boolean;
  historyCount: number;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'transcribe', label: 'Transcribe', icon: <Mic size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  { id: 'history', label: 'History', icon: <History size={18} /> },
];

function TabBar({
  activeTab,
  onTabChange,
  isTranscribing,
  historyCount,
}: TabBarProps): React.JSX.Element {
  return (
    <nav className="tab-bar" role="tablist" aria-label="Main navigation">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const showPulse = tab.id === 'transcribe' && isTranscribing && !isActive;
        const showBadge = tab.id === 'history' && historyCount > 0;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`tab-item ${isActive ? 'tab-item-active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon">
              {tab.icon}
              {showPulse && <span className="tab-pulse" aria-label="Transcription in progress" />}
            </span>
            <span className="tab-label">{tab.label}</span>
            {showBadge && <span className="tab-badge">{historyCount}</span>}
          </button>
        );
      })}
    </nav>
  );
}

export { TabBar };
