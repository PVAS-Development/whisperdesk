import { execSync } from 'child_process';
import type { GpuInfo } from '../../shared/types';

export function detectGpuStatus(): GpuInfo {
  const platform = process.platform;

  if (platform !== 'darwin') {
    return {
      available: false,
      type: 'cpu',
      name: 'CPU only',
    };
  }

  try {
    const cpuInfo = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf-8' });

    if (cpuInfo.includes('Apple')) {
      return {
        available: true,
        type: 'metal',
        name: 'Apple Silicon (Metal)',
      };
    }

    return {
      available: true,
      type: 'metal',
      name: 'macOS Metal (GPU acceleration available)',
    };
  } catch (error) {
    console.error(
      'Failed to detect GPU status:',
      error instanceof Error ? error.message : String(error)
    );
    return {
      available: false,
      type: 'cpu',
      name: 'CPU only',
    };
  }
}
