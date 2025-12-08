import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppTranscription } from '../../../contexts';

export function ErrorMessage(): React.JSX.Element | null {
  const { error } = useAppTranscription();

  if (!error) {
    return null;
  }

  return (
    <div className="error-message" role="alert" aria-live="assertive">
      <AlertTriangle size={16} aria-hidden="true" /> {error}
    </div>
  );
}
