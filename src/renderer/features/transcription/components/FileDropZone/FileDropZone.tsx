import React, { useCallback, type DragEvent, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { isValidMediaFile, formatFileSize } from '../../../../utils';
import type { SelectedFile } from '../../../../types';
import { openFileDialog, getPathForFile } from '../../../../services/electronAPI';
import './FileDropZone.css';

export interface FileDropZoneProps {
  onFileSelect: (file: SelectedFile) => void;
  selectedFile: SelectedFile | null;
  disabled: boolean;
  onClear?: () => void;
}

function FileDropZone({
  onFileSelect,
  selectedFile,
  disabled,
  onClear,
}: FileDropZoneProps): React.JSX.Element {
  const handleClick = async (): Promise<void> => {
    if (disabled) return;

    const filePath = await openFileDialog();
    if (filePath) {
      const fileName = filePath.split('/').pop();
      if (fileName && isValidMediaFile(fileName)) {
        onFileSelect({ path: filePath, name: fileName });
      }
    }
  };

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && isValidMediaFile(file.name)) {
        const filePath = getPathForFile(file);
        if (filePath) {
          onFileSelect({ path: filePath, name: file.name });
        }
      }
    },
    [disabled, onFileSelect]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleClick();
    }
  };

  const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    onClear?.();
  };

  return (
    <div
      className={`dropzone ${disabled ? 'disabled' : ''} ${selectedFile ? 'has-file' : ''}`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={
        selectedFile
          ? `Selected file: ${selectedFile.name}. Click to change file.`
          : 'Drop audio or video file here, or click to browse'
      }
      onKeyDown={handleKeyDown}
    >
      {selectedFile ? (
        <div className="file-info">
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={16} />}
            iconOnly
            onClick={handleRemoveClick}
            title="Remove file"
            aria-label="Remove selected file"
            className="file-remove"
          />
          <span className="file-icon">📁</span>
          <div className="file-details">
            <span className="file-name">{selectedFile.name}</span>
            {selectedFile.size && (
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            )}
          </div>
          <span className="file-change">Click to change</span>
        </div>
      ) : (
        <div className="dropzone-content">
          <span className="dropzone-icon">📂</span>
          <span className="dropzone-text">Drop audio/video file here</span>
          <span className="dropzone-subtext">or click to browse</span>
          <span className="dropzone-formats">
            MP3, WAV, M4A, FLAC, OGG, MP4, MOV, AVI, MKV, WEBM
          </span>
        </div>
      )}
    </div>
  );
}

export { FileDropZone };
