#!/usr/bin/env python3
"""
Model management utilities for WhisperDesk
"""

import json
import os
import sys
import whisper

# Model information
MODELS = {
    "tiny": {"size": "39 MB", "params": "39M", "speed": "~32x", "quality": 1, "vram": "~1 GB"},
    "base": {"size": "74 MB", "params": "74M", "speed": "~16x", "quality": 2, "vram": "~1 GB"},
    "small": {"size": "244 MB", "params": "244M", "speed": "~6x", "quality": 3, "vram": "~2 GB"},
    "medium": {"size": "769 MB", "params": "769M", "speed": "~2x", "quality": 4, "vram": "~5 GB"},
    "large": {"size": "1.5 GB", "params": "1550M", "speed": "~1x", "quality": 5, "vram": "~10 GB"},
}


def get_model_cache_dir():
    """Get the Whisper model cache directory."""
    return os.path.join(os.path.expanduser("~"), ".cache", "whisper")


def is_model_downloaded(model_name):
    """Check if a model is already downloaded."""
    cache_dir = get_model_cache_dir()
    # Whisper model files are named like 'tiny.pt', 'base.pt', etc.
    model_file = os.path.join(cache_dir, f"{model_name}.pt")
    return os.path.exists(model_file)


def get_model_file_size(model_name):
    """Get the actual file size of a downloaded model."""
    cache_dir = get_model_cache_dir()
    model_file = os.path.join(cache_dir, f"{model_name}.pt")
    if os.path.exists(model_file):
        size_bytes = os.path.getsize(model_file)
        size_mb = size_bytes / (1024 * 1024)
        if size_mb > 1000:
            return f"{size_mb / 1024:.1f} GB"
        return f"{size_mb:.0f} MB"
    return None


def get_all_models_status():
    """Get status of all available models."""
    result = []
    for name, info in MODELS.items():
        downloaded = is_model_downloaded(name)
        actual_size = get_model_file_size(name) if downloaded else None
        result.append({
            "name": name,
            "size": actual_size or info["size"],
            "params": info["params"],
            "speed": info["speed"],
            "quality": info["quality"],
            "vram": info["vram"],
            "downloaded": downloaded,
        })
    return result


def check_gpu_available():
    """Check if GPU acceleration is available."""
    try:
        import torch
        if torch.cuda.is_available():
            return {"available": True, "type": "cuda", "name": torch.cuda.get_device_name(0)}
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return {"available": True, "type": "mps", "name": "Apple Silicon (Metal)"}
        else:
            return {"available": False, "type": "cpu", "name": "CPU only"}
    except Exception as e:
        return {"available": False, "type": "cpu", "name": "CPU only", "error": str(e)}


def download_model(model_name):
    """Download a specific model."""
    if model_name not in MODELS:
        return {"success": False, "error": f"Unknown model: {model_name}"}
    
    try:
        print(json.dumps({"status": "downloading", "model": model_name}), file=sys.stderr, flush=True)
        whisper.load_model(model_name)
        print(json.dumps({"status": "complete", "model": model_name}), file=sys.stderr, flush=True)
        return {"success": True, "model": model_name}
    except Exception as e:
        return {"success": False, "error": str(e)}


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Whisper model management")
    parser.add_argument("--action", "-a", required=True, 
                       choices=["list", "check", "download", "gpu"],
                       help="Action to perform")
    parser.add_argument("--model", "-m", help="Model name (for download)")
    
    args = parser.parse_args()
    
    if args.action == "list":
        models = get_all_models_status()
        print(json.dumps({"models": models}))
    
    elif args.action == "check":
        if not args.model:
            print(json.dumps({"error": "Model name required"}))
            sys.exit(1)
        downloaded = is_model_downloaded(args.model)
        print(json.dumps({"model": args.model, "downloaded": downloaded}))
    
    elif args.action == "download":
        if not args.model:
            print(json.dumps({"error": "Model name required"}))
            sys.exit(1)
        result = download_model(args.model)
        print(json.dumps(result))
    
    elif args.action == "gpu":
        gpu_info = check_gpu_available()
        print(json.dumps(gpu_info))


if __name__ == "__main__":
    main()
