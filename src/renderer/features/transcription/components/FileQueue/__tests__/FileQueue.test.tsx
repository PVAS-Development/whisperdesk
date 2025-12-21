import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileQueue } from '../FileQueue';
import type { QueueItem } from '@/types';

describe('FileQueue', () => {
  const createMockQueueItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
    id: 'item-1',
    file: {
      name: 'audio.mp3',
      path: '/path/to/audio.mp3',
      size: 1024,
    },
    status: 'pending',
    progress: { percent: 0, status: '' },
    ...overrides,
  });

  const defaultProps = {
    queue: [createMockQueueItem()],
    onRemove: vi.fn(),
    onClearCompleted: vi.fn(),
    onSelectItem: vi.fn(),
    selectedItemId: null,
    disabled: false,
  };

  describe('rendering', () => {
    it('should return null when queue is empty', () => {
      const { container } = render(<FileQueue {...defaultProps} queue={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render file queue with items', () => {
      render(<FileQueue {...defaultProps} />);
      expect(screen.getByText('FILES (1)')).toBeInTheDocument();
      expect(screen.getByText('audio.mp3')).toBeInTheDocument();
    });

    it('should display file size', () => {
      render(<FileQueue {...defaultProps} />);
      expect(screen.getByText('1 KB')).toBeInTheDocument();
    });

    it('should display correct count for multiple files', () => {
      const queue = [
        createMockQueueItem({ id: '1', file: { name: 'a.mp3', path: '/a', size: 100 } }),
        createMockQueueItem({ id: '2', file: { name: 'b.mp3', path: '/b', size: 200 } }),
        createMockQueueItem({ id: '3', file: { name: 'c.mp3', path: '/c', size: 300 } }),
      ];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.getByText('FILES (3)')).toBeInTheDocument();
    });
  });

  describe('status icons', () => {
    it('should show pending icon for pending status', () => {
      render(<FileQueue {...defaultProps} />);
      const item = screen.getByText('audio.mp3').closest('.file-queue-item');
      expect(item).toHaveClass('pending');
    });

    it('should show processing status for processing item', () => {
      const queue = [createMockQueueItem({ status: 'processing' })];
      render(<FileQueue {...defaultProps} queue={queue} />);
      const item = screen.getByText('audio.mp3').closest('.file-queue-item');
      expect(item).toHaveClass('processing');
    });

    it('should show completed status for completed item', () => {
      const queue = [createMockQueueItem({ status: 'completed' })];
      render(<FileQueue {...defaultProps} queue={queue} />);
      const item = screen.getByText('audio.mp3').closest('.file-queue-item');
      expect(item).toHaveClass('completed');
    });

    it('should show error status for error item', () => {
      const queue = [createMockQueueItem({ status: 'error', error: 'Failed' })];
      render(<FileQueue {...defaultProps} queue={queue} />);
      const item = screen.getByText('audio.mp3').closest('.file-queue-item');
      expect(item).toHaveClass('error');
    });

    it('should show cancelled status for cancelled item', () => {
      const queue = [createMockQueueItem({ status: 'cancelled' })];
      render(<FileQueue {...defaultProps} queue={queue} />);
      const item = screen.getByText('audio.mp3').closest('.file-queue-item');
      expect(item).toHaveClass('cancelled');
    });
  });

  describe('progress', () => {
    it('should show progress percentage for processing items', () => {
      const queue = [
        createMockQueueItem({
          status: 'processing',
          progress: { percent: 50, status: 'Processing...' },
        }),
      ];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should not show progress percentage for non-processing items', () => {
      render(<FileQueue {...defaultProps} />);
      expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('should display error message for failed items', () => {
      const queue = [createMockQueueItem({ status: 'error', error: 'Transcription failed' })];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.getByText('Transcription failed')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onSelectItem when clicking an item', () => {
      const onSelectItem = vi.fn();
      render(<FileQueue {...defaultProps} onSelectItem={onSelectItem} />);

      fireEvent.click(screen.getByText('audio.mp3'));
      expect(onSelectItem).toHaveBeenCalledWith('item-1');
    });

    it('should call onRemove when clicking remove button', () => {
      const onRemove = vi.fn();
      render(<FileQueue {...defaultProps} onRemove={onRemove} />);

      const removeButton = screen.getByLabelText('Remove audio.mp3 from queue');
      fireEvent.click(removeButton);
      expect(onRemove).toHaveBeenCalledWith('item-1');
    });

    it('should not call onRemove when disabled', () => {
      const onRemove = vi.fn();
      render(<FileQueue {...defaultProps} onRemove={onRemove} disabled={true} />);

      const removeButton = screen.getByLabelText('Remove audio.mp3 from queue');
      fireEvent.click(removeButton);
      expect(onRemove).not.toHaveBeenCalled();
    });

    it('should highlight selected item', () => {
      render(<FileQueue {...defaultProps} selectedItemId="item-1" />);
      const item = screen.getByText('audio.mp3').closest('.file-queue-item');
      expect(item).toHaveClass('selected');
    });
  });

  describe('clear completed button', () => {
    it('should show clear button when there are completed items', () => {
      const queue = [createMockQueueItem({ status: 'completed' })];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.getByText(/Clear/)).toBeInTheDocument();
    });

    it('should not show clear button when no completed items', () => {
      render(<FileQueue {...defaultProps} />);
      expect(screen.queryByText(/Clear/)).not.toBeInTheDocument();
    });

    it('should call onClearCompleted when clicking clear button', () => {
      const onClearCompleted = vi.fn();
      const queue = [createMockQueueItem({ status: 'completed' })];
      render(<FileQueue {...defaultProps} queue={queue} onClearCompleted={onClearCompleted} />);

      fireEvent.click(screen.getByText(/Clear/));
      expect(onClearCompleted).toHaveBeenCalled();
    });
  });

  describe('summary', () => {
    it('should show completed count', () => {
      const queue = [
        createMockQueueItem({ id: '1', status: 'completed' }),
        createMockQueueItem({ id: '2', status: 'completed' }),
      ];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.getByText('2 completed')).toBeInTheDocument();
    });

    it('should show pending count', () => {
      const queue = [
        createMockQueueItem({ id: '1', status: 'pending' }),
        createMockQueueItem({ id: '2', status: 'pending' }),
        createMockQueueItem({ id: '3', status: 'pending' }),
      ];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.getByText('3 pending')).toBeInTheDocument();
    });

    it('should show processing count', () => {
      const queue = [createMockQueueItem({ status: 'processing' })];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.getByText('1 processing')).toBeInTheDocument();
    });

    it('should show failed count', () => {
      const queue = [createMockQueueItem({ status: 'error', error: 'Failed' })];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.getByText('1 failed')).toBeInTheDocument();
    });

    it('should show hint when completed and not processing', () => {
      const queue = [createMockQueueItem({ status: 'completed' })];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.getByText('Click a file to view its transcription')).toBeInTheDocument();
    });

    it('should not show hint when processing', () => {
      const queue = [
        createMockQueueItem({ id: '1', status: 'completed' }),
        createMockQueueItem({ id: '2', status: 'processing' }),
      ];
      render(<FileQueue {...defaultProps} queue={queue} />);
      expect(screen.queryByText('Click a file to view its transcription')).not.toBeInTheDocument();
    });
  });
});
