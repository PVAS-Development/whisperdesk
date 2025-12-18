import { useEffect, useRef } from 'react';
import type { Unsubscribe } from '../types';
import {
  onMenuOpenFile,
  onMenuSaveFile,
  onMenuCopyTranscription,
  onMenuStartTranscription,
  onMenuCancelTranscription,
  onMenuToggleHistory,
} from '../services/electronAPI';

export interface ElectronMenuHandlers {
  onOpenFile?: () => void;
  onSaveFile?: () => void;
  onCopyTranscription?: () => void;
  onStartTranscription?: () => void;
  onCancelTranscription?: () => void;
  onToggleHistory?: () => void;
}

export function useElectronMenu(handlers: ElectronMenuHandlers): void {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const unsubscribers: Unsubscribe[] = [];

    unsubscribers.push(
      onMenuOpenFile(() => {
        handlersRef.current.onOpenFile?.();
      })
    );

    unsubscribers.push(
      onMenuSaveFile(() => {
        handlersRef.current.onSaveFile?.();
      })
    );

    unsubscribers.push(
      onMenuCopyTranscription(() => {
        handlersRef.current.onCopyTranscription?.();
      })
    );

    unsubscribers.push(
      onMenuStartTranscription(() => {
        handlersRef.current.onStartTranscription?.();
      })
    );

    unsubscribers.push(
      onMenuCancelTranscription(() => {
        handlersRef.current.onCancelTranscription?.();
      })
    );

    unsubscribers.push(
      onMenuToggleHistory(() => {
        handlersRef.current.onToggleHistory?.();
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);
}
