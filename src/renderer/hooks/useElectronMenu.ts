import { useEffect, useRef } from 'react';
import type { Unsubscribe } from '../types';

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
    const unsubscribers: (Unsubscribe | undefined)[] = [];

    unsubscribers.push(
      window.electronAPI?.onMenuOpenFile(() => {
        handlersRef.current.onOpenFile?.();
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuSaveFile(() => {
        handlersRef.current.onSaveFile?.();
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuCopyTranscription(() => {
        handlersRef.current.onCopyTranscription?.();
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuStartTranscription(() => {
        handlersRef.current.onStartTranscription?.();
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuCancelTranscription(() => {
        handlersRef.current.onCancelTranscription?.();
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuToggleHistory(() => {
        handlersRef.current.onToggleHistory?.();
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub?.());
    };
  }, []);
}
