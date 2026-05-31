type RecordingMode = 'audio' | 'video';

type RecordingOptions = {
  mode: RecordingMode;
  videoTrack?: MediaStreamTrack;
  audioStream: MediaStream;
};

export class RecordingController {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  start(options: RecordingOptions): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      throw new Error('Recording is already in progress.');
    }

    const tracks = [...options.audioStream.getAudioTracks()];

    if (options.mode === 'video' && options.videoTrack) {
      tracks.unshift(options.videoTrack);
    }

    const recordingStream = new MediaStream(tracks);
    const mimeType = options.mode === 'video' ? 'video/webm;codecs=vp9,opus' : 'audio/webm;codecs=opus';

    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(recordingStream, { mimeType });

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.start(300);
  }

  stop(): Promise<Blob> {
    const recorder = this.mediaRecorder;

    if (!recorder || recorder.state === 'inactive') {
      throw new Error('No active recording to stop.');
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const result = new Blob([...this.chunks], {
          type: recorder.mimeType
        });

        this.mediaRecorder = null;
        this.chunks = [];
        resolve(result);
      };

      recorder.stop();
    });
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
