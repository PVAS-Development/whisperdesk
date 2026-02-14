import React from 'react';
import { TranscriptionHistory } from '../../../features/history';
import { useAppHistory } from '../../../contexts';
import type { TabId } from '../TabBar';
import './HistoryTab.css';

export interface HistoryTabProps {
  onSwitchTab: (tab: TabId) => void;
}

function HistoryTab({ onSwitchTab }: HistoryTabProps): React.JSX.Element {
  const { history, clearHistory, selectHistoryItem, removeHistoryItem } = useAppHistory();

  const handleSelect = (item: Parameters<typeof selectHistoryItem>[0]): void => {
    selectHistoryItem(item);
    onSwitchTab('transcribe');
  };

  return (
    <div className="history-tab" id="panel-history" role="tabpanel" aria-labelledby="tab-history">
      <TranscriptionHistory
        history={history}
        onClear={clearHistory}
        onSelect={handleSelect}
        onDelete={removeHistoryItem}
      />
    </div>
  );
}

export { HistoryTab };
