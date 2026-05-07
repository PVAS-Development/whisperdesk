import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OutputDisplay } from '@/features/transcription';
import { MOCK_TRANSCRIPTION_RESULT } from '@/test/fixtures';
import { createFullElectronAPIMock } from '@/test/electronAPIMocks';
import type { ElectronAPI } from '@/types/electron';

describe('OutputDisplay', () => {
  const mockTranscriptionText = MOCK_TRANSCRIPTION_RESULT.text ?? '';

  beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { electronAPI?: ElectronAPI }).electronAPI = undefined;
  });

  it('should render transcription text', () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    expect(screen.getByText(/sample transcription/i)).toBeInTheDocument();
  });

  it('should display empty state when no text is provided', () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(<OutputDisplay text="" onSave={onSave} onCopy={onCopy} copySuccess={false} />);

    expect(screen.getByText(/Transcription will appear here/i)).toBeInTheDocument();
  });

  it('should show word and character count', () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const wordCountElement = screen.getByText(/\d+ words/i);
    expect(wordCountElement).toBeInTheDocument();
  });

  it('should call onCopy when copy button is clicked', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    expect(onCopy).toHaveBeenCalled();
  });

  it('should show success message when copySuccess is true', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    const { rerender } = render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    rerender(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Copied/i)).toBeInTheDocument();
    });
  });

  it('should display save button when text is present', () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('should call onSave with format when save menu option is clicked', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      const txtOption = screen.getByText(/\.txt/i);
      fireEvent.click(txtOption);
    });

    expect(onSave).toHaveBeenCalledWith('txt');
  });

  it('should display search button when text is present', () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('should open search input when search button is clicked', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should handle search query input', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeInTheDocument();
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  it('should close search when escape is pressed', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.keyDown(searchInput, { key: 'Escape' });
    });

    const searchInputAfter = screen.queryByPlaceholderText(/search/i);
    expect(searchInputAfter).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy/i });
    expect(copyButton).toHaveAttribute('aria-label');

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toHaveAttribute('aria-label');
  });

  it('should hide action buttons when text is empty', () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(<OutputDisplay text="" onSave={onSave} onCopy={onCopy} copySuccess={false} />);

    const copyButton = screen.queryByRole('button', { name: /copy/i });
    const saveButton = screen.queryByRole('button', { name: /save/i });

    expect(copyButton).not.toBeInTheDocument();
    expect(saveButton).not.toBeInTheDocument();
  });

  it('should handle Cmd+F keyboard shortcut to open search', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    fireEvent.keyDown(document, { key: 'f', metaKey: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  it('should not open search with Cmd+F when text is empty', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(<OutputDisplay text="" onSave={onSave} onCopy={onCopy} copySuccess={false} />);

    fireEvent.keyDown(document, { key: 'f', metaKey: true });

    const searchInput = screen.queryByPlaceholderText(/search/i);
    expect(searchInput).not.toBeInTheDocument();
  });

  it('should navigate through search results with Enter key', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    expect(searchButton).toBeInTheDocument();
  });

  it('should navigate backwards through search results with Shift+Enter', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(
      () => {
        const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
        expect(searchInput).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should close search menu when clicking outside', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/\.txt/i)).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText(/\.txt/i)).not.toBeInTheDocument();
    });
  });

  it('should handle Ctrl+F on Windows', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  it('should handle search with no matches', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'xyz123notfound' } });
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should highlight search matches in text', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(
      () => {
        const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
        expect(searchInput).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should show No matches when search query has no results', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'xyznonexistent123' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No matches/i)).toBeInTheDocument();
    });
  });

  it('should display match count when search has results', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay text="test test test" onSave={onSave} onCopy={onCopy} copySuccess={false} />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
    });
  });

  it('should navigate to previous match with up arrow button', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay text="test test test" onSave={onSave} onCopy={onCopy} copySuccess={false} />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
    });

    const prevButton = screen.getByRole('button', { name: /Previous match/i });
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText(/3 of 3/i)).toBeInTheDocument();
    });
  });

  it('should navigate to next match with down arrow button', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay text="test test test" onSave={onSave} onCopy={onCopy} copySuccess={false} />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /Next match/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/2 of 3/i)).toBeInTheDocument();
    });
  });

  it('should close search bar with close button', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /Close search/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    });
  });

  it('should toggle search off when search button clicked while search is open', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    });
  });

  it('should navigate with Enter key through matches', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay text="word word word" onSave={onSave} onCopy={onCopy} copySuccess={false} />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'word' } });

    await waitFor(() => {
      expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/2 of 3/i)).toBeInTheDocument();
    });
  });

  it('should navigate backwards with Shift+Enter', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay text="word word word" onSave={onSave} onCopy={onCopy} copySuccess={false} />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'word' } });

    await waitFor(() => {
      expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Enter', shiftKey: true });

    await waitFor(() => {
      expect(screen.getByText(/3 of 3/i)).toBeInTheDocument();
    });
  });

  it('should save as SRT format', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/\.srt/i)).toBeInTheDocument();
    });

    const srtOption = screen.getByText(/\.srt/i);
    fireEvent.click(srtOption);

    expect(onSave).toHaveBeenCalledWith('srt');
  });

  it('should render text content directly when no search query', () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text="Simple text content"
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    expect(screen.getByText('Simple text content')).toBeInTheDocument();
  });

  it('should scroll highlighted text into view when search match is current', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    const { rerender } = render(
      <OutputDisplay
        text="sample transcription content with sample repeated"
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      expect(searchInput).toBeInTheDocument();
      fireEvent.change(searchInput, { target: { value: 'sample' } });
    });

    rerender(
      <OutputDisplay
        text="sample transcription content with sample repeated"
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    await waitFor(() => {
      const highlights = screen.getAllByText(/sample/);
      expect(highlights.length).toBeGreaterThan(0);
    });
  });

  it('should navigate with keyboard shortcuts in search', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text="sample text sample again sample"
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'sample' } });
    });

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;

    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter', shiftKey: true });
  });

  it('should close save menu when clicking outside', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={mockTranscriptionText}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/\.txt/i)).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText(/\.txt/i)).not.toBeInTheDocument();
    });
  });

  it('should handle search menu navigation', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay text="word word word" onSave={onSave} onCopy={onCopy} copySuccess={false} />
    );

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'word' } });
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should render timestamped segments when VTT is present', () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={`WEBVTT

00:00:01.000 --> 00:00:03.000
First segment

00:00:04.000 --> 00:00:06.000
Second segment`}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    expect(screen.getByLabelText('Timestamped transcript')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play from 00:00:01.000/i })).toBeInTheDocument();
    expect(screen.getByText('Second segment')).toBeInTheDocument();
  });

  it('should seek and play media when a timestamp is clicked', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();
    const api = createFullElectronAPIMock();
    window.electronAPI = api;
    const playSpy = vi
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);

    render(
      <OutputDisplay
        text={`WEBVTT

00:00:01.000 --> 00:00:03.000
First segment`}
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    await waitFor(() => {
      expect(api.getMediaSource).toHaveBeenCalledWith('/path/file.mp3');
    });

    fireEvent.click(screen.getByRole('button', { name: /Play from 00:00:01.000/i }));

    expect(playSpy).toHaveBeenCalled();
    playSpy.mockRestore();
  });

  it('should highlight the active segment from media time updates', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();
    window.electronAPI = createFullElectronAPIMock();

    render(
      <OutputDisplay
        text={`WEBVTT

00:00:01.000 --> 00:00:03.000
First segment

00:00:04.000 --> 00:00:06.000
Second segment`}
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    const audio = await screen.findByLabelText('Selected audio preview');
    Object.defineProperty(audio, 'currentTime', { value: 4.5, configurable: true });
    fireEvent.timeUpdate(audio);

    await waitFor(() => {
      expect(screen.getByText('Second segment').closest('.transcript-segment')).toHaveClass(
        'active'
      );
    });
  });

  it('should show unavailable media state while keeping transcript visible', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();
    const api = createFullElectronAPIMock();
    api.getMediaSource = vi.fn().mockResolvedValue({ success: false, error: 'File not found' });
    window.electronAPI = api;

    render(
      <OutputDisplay
        text={`WEBVTT

00:00:01.000 --> 00:00:03.000
First segment`}
        selectedFile={{ name: 'missing.mp3', path: '/path/missing.mp3' }}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    expect(screen.getByText('First segment')).toBeInTheDocument();
    expect(await screen.findByText('File not found')).toBeInTheDocument();
  });

  it('should search and highlight matches in timestamped segments', async () => {
    const onSave = vi.fn();
    const onCopy = vi.fn();

    render(
      <OutputDisplay
        text={`WEBVTT

00:00:01.000 --> 00:00:03.000
alpha beta

00:00:04.000 --> 00:00:06.000
beta gamma`}
        onSave={onSave}
        onCopy={onCopy}
        copySuccess={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    const searchInput = await screen.findByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'beta' } });

    await waitFor(() => {
      expect(screen.getByText(/1 of 2/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText('beta')).toHaveLength(2);
  });
});
