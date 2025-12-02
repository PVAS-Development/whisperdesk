import React from 'react';
import { useAppTranscription } from '../../../contexts';

export function ErrorMessage(): React.JSX.Element | null {
  const { error } = useAppTranscription();

  if (!error) {
    return null;
  }

  return (
    <div className="error-message" role="alert" aria-live="assertive">
      ⚠️ {error}
    </div>
  );
}
