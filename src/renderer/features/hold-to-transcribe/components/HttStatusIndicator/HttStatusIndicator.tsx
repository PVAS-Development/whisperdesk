import type { HttStatus } from '../../../../types';
import { Mic, Loader, AlertCircle } from 'lucide-react';
import './HttStatusIndicator.css';

interface HttStatusIndicatorProps {
  status: HttStatus;
}

function HttStatusIndicator({ status }: HttStatusIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className={`htt-status-indicator htt-status-${status}`}>
      {status === 'recording' && (
        <>
          <Mic size={16} className="htt-icon htt-icon-recording" />
          <span>Recording...</span>
        </>
      )}
      {status === 'processing' && (
        <>
          <Loader size={16} className="htt-icon htt-icon-processing" />
          <span>Transcribing...</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={16} className="htt-icon" />
          <span>Error</span>
        </>
      )}
    </div>
  );
}

export { HttStatusIndicator };
