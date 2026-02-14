import React from 'react';
import { SettingsPanel } from '../../../features/settings';
import { HttSettings } from '../../../features/hold-to-transcribe';
import { useAppTranscription } from '../../../contexts';
import './SettingsTab.css';

function SettingsTab(): React.JSX.Element {
  const { settings, isTranscribing, setSettings, setModelDownloaded } = useAppTranscription();

  return (
    <div
      className="settings-tab"
      id="panel-settings"
      role="tabpanel"
      aria-labelledby="tab-settings"
    >
      <div className="settings-tab-content">
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          disabled={isTranscribing}
          onModelStatusChange={setModelDownloaded}
        />
        <HttSettings />
      </div>
    </div>
  );
}

export { SettingsTab };
