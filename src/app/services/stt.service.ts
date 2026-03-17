// stt.service.ts — Backend-mediated Speech-to-Text via Azure OpenAI Whisper
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SttService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Check if the browser supports MediaRecorder (required for audio capture).
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices && typeof MediaRecorder !== 'undefined');
  }

  /**
   * Request mic access and return the raw MediaStream.
   * Rejects if mic permission is denied.
   */
  acquireStream(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
        channelCount: 1
      }
    });
  }

  /**
   * Create a MediaRecorder from an already-live stream.
   */
  createRecorder(stream: MediaStream): MediaRecorder {
    const mimeType = this.pickMimeType();
    return mimeType
      ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128_000 })
      : new MediaRecorder(stream, { audioBitsPerSecond: 128_000 });
  }

  /**
   * Send a recorded audio Blob to the backend Whisper endpoint.
   * Returns an Observable that emits the transcribed text string.
   */
  transcribe(audioBlob: Blob, language?: string): Observable<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, this.blobFilename(audioBlob.type));
    if (language) {
      formData.append('language', this.toBcp47Base(language));
    }

    return this.http
      .post<{ text: string }>(`${this.apiUrl}/api/v1/stt/transcribe`, formData)
      .pipe(map(res => res.text ?? ''));
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Pick the best supported MIME type for MediaRecorder. */
  private pickMimeType(): string {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    return candidates.find(m => MediaRecorder.isTypeSupported(m)) ?? '';
  }

  /** Map a MIME type to a filename the backend / Whisper will accept. */
  private blobFilename(mimeType: string): string {
    if (mimeType.includes('ogg')) return 'audio.ogg';
    if (mimeType.includes('mp4')) return 'audio.mp4';
    return 'audio.webm';
  }

  /**
   * Convert a BCP-47 tag like "nb-NO" → "no" (Whisper uses ISO-639-1 base codes).
   * Falls back to the full tag if not recognised.
   */
  private toBcp47Base(lang: string): string {
    const map: Record<string, string> = {
      'en-US': 'en', 'en-GB': 'en',
      'nb-NO': 'no', 'nn-NO': 'no',
      'sv-SE': 'sv',
      'da-DK': 'da',
      'fi-FI': 'fi',
      'is-IS': 'is',
    };
    return map[lang] ?? lang.split('-')[0];
  }
}
