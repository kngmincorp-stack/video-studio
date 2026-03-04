export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface TranscriptionResult {
  fileName: string;
  durationSeconds: number;
  language: string;
  segments: TranscriptSegment[];
}

export interface SelectedMediaFile {
  name: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface TranscriptionState {
  status: "idle" | "selecting" | "uploading" | "transcribing" | "done" | "error";
  progress?: string;
  result?: TranscriptionResult;
  error?: string;
  selectedFile?: SelectedMediaFile;
}
