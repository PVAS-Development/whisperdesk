let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let stream: MediaStream | null = null;

export async function startRecording(deviceId?: string): Promise<void> {
  audioChunks = [];

  const audioConstraints: MediaTrackConstraints = {
    channelCount: 1,
    sampleRate: 16000,
    echoCancellation: true,
    noiseSuppression: true,
  };
  if (deviceId) {
    audioConstraints.deviceId = { exact: deviceId };
  }

  stream = await navigator.mediaDevices.getUserMedia({
    audio: audioConstraints,
  });

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'audio/webm;codecs=opus',
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start(100);
}

export async function stopRecording(): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      reject(new Error('No active recording'));
      return;
    }

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const buffer = await blob.arrayBuffer();

      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      mediaRecorder = null;
      audioChunks = [];

      resolve(buffer);
    };

    mediaRecorder.stop();
  });
}
