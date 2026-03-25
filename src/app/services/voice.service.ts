// voice.service.ts — Push-to-talk recorder; transcription handled by backend (Whisper)
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SttService } from './stt.service';

export interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;   // true while waiting for backend transcription
  transcript: string;
  language: string;
  error: string | null;
  commandDetected?: 'SEND' | null;
  lastInputWasVoice?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];

  // Persists transcript across record/stop cycles; cleared only on send or clearTranscript()
  private savedTranscript = '';
  private _lastInputWasVoice = false;

  private voiceState = new BehaviorSubject<VoiceState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    language: 'en-US',
    error: null,
    commandDetected: null
  });

  voiceState$ = this.voiceState.asObservable();

  // Nordic languages and English (same set as before)
  supportedLanguages: Record<string, string> = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'nb-NO': 'Norwegian Bokmål',
    'nn-NO': 'Norwegian Nynorsk',
    'sv-SE': 'Swedish',
    'da-DK': 'Danish',
    'fi-FI': 'Finnish',
    'is-IS': 'Icelandic'
  };

  constructor(private sttService: SttService, private ngZone: NgZone) {}

  // ---------------------------------------------------------------------------
  // Public API (unchanged from previous implementation)
  // ---------------------------------------------------------------------------

  getDefaultLanguage(): string {
    return 'en-US';
  }

  startRecording(language: string = ''): void {
    if (this.voiceState.value.isRecording) return;

    if (!this.sttService.isSupported()) {
      this.updateState({ error: 'Microphone recording not supported in this browser.' });
      return;
    }

    this.updateState({ isRecording: true, error: null, language });
    this.audioChunks = [];

    this.getOrAcquireStream().then(stream => {
      this.mediaStream = stream;
      const recorder = this.sttService.createRecorder(stream);
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      recorder.onstop = () => this.ngZone.run(() => this.onRecorderStopped(language));

      recorder.start(500);
    }).catch((err: Error) => {
      this.mediaStream = null;
      const msg = err.message?.toLowerCase().includes('denied')
        ? 'Microphone access denied. Please allow access in browser settings.'
        : 'Could not access microphone.';
      this.updateState({ isRecording: false, error: msg });
    });
  }

  /** Release the warm mic stream (call when the chat panel closes). */
  releaseStream(): void {
    this.stopStream();
  }

  stopRecording(): void {
    if (!this.voiceState.value.isRecording) return;

    // isRecording → false immediately so the button responds at once
    this.updateState({ isRecording: false, isProcessing: true });

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop(); // triggers onstop → onRecorderStopped
    } else {
      this.mediaRecorder = null;
      this.updateState({ isProcessing: false });
    }
  }

  isSupported(): boolean {
    return this.sttService.isSupported();
  }

  isRecording(): boolean {
    return this.voiceState.value.isRecording;
  }

  getTranscript(): string {
    return this.voiceState.value.transcript;
  }

  clearTranscript(): void {
    this.savedTranscript = '';
    this.updateState({ transcript: '', error: null, commandDetected: null });
  }

  /** Call this whenever the user manually edits the textarea so savedTranscript stays in sync. */
  syncTranscript(text: string): void {
    this.savedTranscript = text.trim();
  }

  getSupportedLanguages(): Record<string, string> {
    return this.supportedLanguages;
  }

  markVoiceSend(): void {
    this._lastInputWasVoice = true;
  }

  consumeVoiceSendFlag(): boolean {
    const was = this._lastInputWasVoice;
    this._lastInputWasVoice = false;
    return was;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private onRecorderStopped(language: string): void {
    // Keep mediaStream alive for the next recording (avoids getUserMedia delay).
    // Stream is released only via releaseStream().
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    this.mediaRecorder = null;

    if (this.audioChunks.length === 0) {
      this.updateState({ isProcessing: false, error: 'No audio captured.' });
      return;
    }

    const blob = new Blob(this.audioChunks, { type: mimeType });
    this.audioChunks = [];

    // Pass language only if explicitly set; otherwise let Whisper auto-detect.
    this.sttService.transcribe(blob, language || undefined).subscribe({
      next: (text) => this.handleTranscript(text),
      error: (err) => {
        console.error('[VoiceService] Transcription error:', err);
        this.updateState({
          isProcessing: false,
          error: 'Transcription failed. Please try again.'
        });
      }
    });
  }

  private handleTranscript(text: string): void {
    const combined = this.savedTranscript
      ? (this.savedTranscript + ' ' + text).trim()
      : text.trim();

    const command = this.detectCommand(combined);
    const cleanedTranscript = command ? this.removeCommand(combined) : combined;

    this.savedTranscript = cleanedTranscript;

    this.updateState({
      isProcessing: false,
      transcript: cleanedTranscript,
      commandDetected: command
    });
  }

  private getOrAcquireStream(): Promise<MediaStream> {
    const live = this.mediaStream?.getTracks().every(t => t.readyState === 'live');
    if (live) return Promise.resolve(this.mediaStream!);
    this.stopStream();
    return this.sttService.acquireStream();
  }

  private stopStream(): void {
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.mediaStream = null;
  }

  private detectCommand(transcript: string): 'SEND' | null {
    const text = transcript.trim().replace(/[.,!?;:]+$/, '').trim();
    return /\bask\s+fab\w*$/i.test(text) ? 'SEND' : null;
  }

  private removeCommand(transcript: string): string {
    return transcript.trim().replace(/[.,!?;:]+$/, '').replace(/\s*\bask\s+fab\w*\s*$/i, '').trim();
  }

  private updateState(partial: Partial<VoiceState>): void {
    this.voiceState.next({ ...this.voiceState.value, ...partial });
  }
}
