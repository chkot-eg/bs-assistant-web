// tts.service.ts — Azure OpenAI TTS (backend-mediated)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TtsState {
  isPlaying: boolean;
  isSynthesizing: boolean;
  currentMessageId: string | null;
  error: string | null;
  isMuted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TtsService {
  private apiUrl = environment.apiUrl;
  private currentAudio: HTMLAudioElement | null = null;

  // Client-side cache: messageId → objectURL (avoids re-fetching same audio)
  private audioCache = new Map<string, string>();

  private ttsState = new BehaviorSubject<TtsState>({
    isPlaying: false,
    isSynthesizing: false,
    currentMessageId: null,
    error: null,
    isMuted: false
  });

  ttsState$ = this.ttsState.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Speak a message aloud. If the same message is already playing, stop it (toggle).
   */
  speak(messageId: string, text: string, language: string): void {
    if (this.ttsState.value.isMuted) return;

    // Toggle: if this message is playing, stop it
    if (this.ttsState.value.currentMessageId === messageId
        && this.ttsState.value.isPlaying) {
      this.stop();
      return;
    }

    // Stop any current playback
    this.stop();

    // Check client-side cache
    const cachedUrl = this.audioCache.get(messageId);
    if (cachedUrl) {
      this.playAudioUrl(messageId, cachedUrl);
      return;
    }

    // Show loading state
    this.updateState({
      isSynthesizing: true,
      currentMessageId: messageId,
      error: null
    });

    // Detect audio format support
    const format = this.supportsOpus() ? 'OGG_OPUS' : 'MP3';

    // Call backend
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Session-ID': localStorage.getItem('sessionId') || ''
    });

    this.http.post(`${this.apiUrl}/api/v1/tts/synthesize`,
      { text, language, format },
      { headers, responseType: 'blob' }
    ).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.audioCache.set(messageId, url);
        this.updateState({ isSynthesizing: false });
        this.playAudioUrl(messageId, url);
      },
      error: (err) => {
        console.error('[TTS] Backend synthesis failed:', err);
        this.updateState({
          isSynthesizing: false,
          currentMessageId: null,
          error: this.getErrorMessage(err)
        });
      }
    });
  }

  /**
   * Stop any current playback
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.updateState({
      isPlaying: false,
      isSynthesizing: false,
      currentMessageId: null
    });
  }

  /**
   * Toggle global mute
   */
  toggleMute(): void {
    const isMuted = !this.ttsState.value.isMuted;
    if (isMuted) this.stop();
    this.updateState({ isMuted });
  }

  /**
   * TTS is always "supported" in this version (backend handles synthesis).
   * Returns false only if the browser can't play audio at all.
   */
  isSupported(): boolean {
    return typeof Audio !== 'undefined';
  }

  /**
   * Release all cached audio URLs (call on component destroy)
   */
  cleanup(): void {
    this.stop();
    this.audioCache.forEach(url => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }

  private playAudioUrl(messageId: string, url: string): void {
    this.currentAudio = new Audio(url);

    this.currentAudio.onplay = () => {
      this.updateState({
        isPlaying: true,
        isSynthesizing: false,
        currentMessageId: messageId
      });
    };

    this.currentAudio.onended = () => {
      this.updateState({
        isPlaying: false,
        currentMessageId: null
      });
      this.currentAudio = null;
    };

    this.currentAudio.onerror = () => {
      this.updateState({
        isPlaying: false,
        currentMessageId: null,
        error: 'Audio playback failed'
      });
      this.currentAudio = null;
    };

    this.currentAudio.play().catch((err) => {
      console.warn('[TTS] Autoplay blocked:', err);
      this.updateState({
        isPlaying: false,
        currentMessageId: null,
        error: 'Click the speaker button to hear the response'
      });
    });
  }

  private supportsOpus(): boolean {
    const audio = document.createElement('audio');
    return audio.canPlayType('audio/ogg; codecs=opus') !== '';
  }

  private getErrorMessage(err: any): string {
    if (err.status === 503) return 'Speech service temporarily unavailable';
    if (err.status === 429) return 'Speech service busy, try again shortly';
    if (err.status === 0) return 'Unable to connect to speech service';
    return 'Speech synthesis failed';
  }

  private updateState(partial: Partial<TtsState>): void {
    this.ttsState.next({
      ...this.ttsState.value,
      ...partial
    });
  }
}
