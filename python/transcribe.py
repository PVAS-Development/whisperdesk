#!/usr/bin/env python3
"""
WhisperDesk Transcription Script
Transcribes audio/video files using OpenAI Whisper
"""

import argparse
import json
import sys
import os
import signal
import whisper


# Handle graceful shutdown
def signal_handler(sig, frame):
    """Handle interruption signals (SIGTERM, SIGINT)."""
    send_progress(0, "Transcription cancelled by user")
    sys.exit(130)  # 128 + SIGINT


signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)


def send_progress(percent, status):
    """Send progress update to Electron via stderr as JSON."""
    progress = {"percent": percent, "status": status}
    print(json.dumps(progress), file=sys.stderr, flush=True)


def transcribe(input_path, model_name="base", language=None, output_format="txt"):
    """
    Transcribe an audio/video file using Whisper.
    
    Args:
        input_path: Path to the input file
        model_name: Whisper model (tiny, base, small, medium, large)
        language: Language code or None for auto-detection
        output_format: Output format (txt, srt, vtt, json)
    
    Returns:
        Transcription text or formatted output
    """
    
    # Validate input file exists
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Check if file is readable
    if not os.access(input_path, os.R_OK):
        raise PermissionError(f"Cannot read file: {input_path}")
    
    # Check file size (warn if very large)
    file_size = os.path.getsize(input_path)
    if file_size == 0:
        raise ValueError(f"File is empty: {input_path}")
    if file_size > 2 * 1024 * 1024 * 1024:  # 2GB
        send_progress(3, f"Warning: Large file ({file_size // (1024*1024)}MB). This may take a while...")
    
    # Validate file extension
    valid_extensions = {'.mp4', '.mp3', '.wav', '.m4a', '.webm', '.mov', '.avi', '.flac', '.ogg', '.mkv'}
    _, ext = os.path.splitext(input_path.lower())
    if ext not in valid_extensions:
        send_progress(2, f"Warning: Uncommon file format '{ext}'. Attempting to process...")
    
    # Load model
    send_progress(5, f"Loading {model_name} model...")
    try:
        model = whisper.load_model(model_name)
    except Exception as e:
        raise RuntimeError(f"Failed to load model '{model_name}': {str(e)}")
    
    send_progress(15, "Model loaded. Starting transcription...")
    
    # Transcribe
    options = {
        "verbose": False,
        "fp16": False,  # Use FP32 for compatibility
    }
    
    if language and language != "auto":
        options["language"] = language
    
    send_progress(20, "Transcribing audio...")
    try:
        result = model.transcribe(input_path, **options)
    except Exception as e:
        raise RuntimeError(f"Transcription failed: {str(e)}")
    
    # Check if we got any results
    if not result or "text" not in result:
        raise RuntimeError("Transcription produced no output")
    
    if not result["text"].strip():
        raise ValueError("No speech detected in the audio/video file")
    
    send_progress(90, "Formatting output...")
    
    # Format output based on requested format
    if output_format == "txt":
        output = result["text"].strip()
    
    elif output_format == "json":
        output = json.dumps({
            "text": result["text"],
            "segments": [
                {
                    "id": seg["id"],
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": seg["text"]
                }
                for seg in result["segments"]
            ],
            "language": result.get("language", "unknown")
        }, indent=2)
    
    elif output_format == "srt":
        output = generate_srt(result["segments"])
    
    elif output_format == "vtt":
        output = generate_vtt(result["segments"])
    
    else:
        output = result["text"].strip()
    
    send_progress(100, "Complete!")
    return output


def generate_srt(segments):
    """Generate SRT subtitle format."""
    lines = []
    for i, seg in enumerate(segments, 1):
        start = format_timestamp_srt(seg["start"])
        end = format_timestamp_srt(seg["end"])
        text = seg["text"].strip()
        lines.append(f"{i}\n{start} --> {end}\n{text}\n")
    return "\n".join(lines)


def generate_vtt(segments):
    """Generate WebVTT subtitle format."""
    lines = ["WEBVTT\n"]
    for seg in segments:
        start = format_timestamp_vtt(seg["start"])
        end = format_timestamp_vtt(seg["end"])
        text = seg["text"].strip()
        lines.append(f"{start} --> {end}\n{text}\n")
    return "\n".join(lines)


def format_timestamp_srt(seconds):
    """Format seconds to SRT timestamp (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_timestamp_vtt(seconds):
    """Format seconds to VTT timestamp (HH:MM:SS.mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe audio/video files using OpenAI Whisper"
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to the input audio/video file"
    )
    parser.add_argument(
        "--model", "-m",
        default="base",
        choices=["tiny", "base", "small", "medium", "large"],
        help="Whisper model to use (default: base)"
    )
    parser.add_argument(
        "--language", "-l",
        default=None,
        help="Language code (e.g., 'en', 'es', 'fr'). Leave empty for auto-detection"
    )
    parser.add_argument(
        "--format", "-f",
        default="txt",
        choices=["txt", "srt", "vtt", "json"],
        help="Output format (default: txt)"
    )
    
    args = parser.parse_args()
    
    try:
        result = transcribe(
            input_path=args.input,
            model_name=args.model,
            language=args.language,
            output_format=args.format
        )
        # Output result to stdout
        print(result)
        sys.exit(0)
        
    except FileNotFoundError as e:
        send_progress(0, f"File Error: {str(e)}")
        sys.exit(1)
    
    except PermissionError as e:
        send_progress(0, f"Permission Error: {str(e)}")
        sys.exit(1)
    
    except ValueError as e:
        send_progress(0, f"Validation Error: {str(e)}")
        sys.exit(1)
    
    except RuntimeError as e:
        send_progress(0, f"Runtime Error: {str(e)}")
        sys.exit(1)
    
    except MemoryError:
        send_progress(0, "Memory Error: Insufficient memory. Try using a smaller model.")
        sys.exit(1)
    
    except KeyboardInterrupt:
        send_progress(0, "Transcription cancelled by user")
        sys.exit(130)
        
    except Exception as e:
        send_progress(0, f"Unexpected Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
