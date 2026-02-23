// voice.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  interimTranscript: string; // Added for showing real-time text
  language: string;
  error: string | null;
  commandDetected?: 'SEND' | null; // Voice command detected
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  // Set to true only when the user (or a fatal error) explicitly stops recording.
  // Prevents auto-restart in onend for intentional/fatal stops.
  private intentionallyStopped = false;
  private autoRestartTimeout: ReturnType<typeof setTimeout> | null = null;

  // Store final results separately to avoid duplication
  private finalTranscript = '';
  // Persists transcript across stop/resume cycles; cleared only on send or clearTranscript()
  private savedTranscript = '';

  private voiceState = new BehaviorSubject<VoiceState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    interimTranscript: '',
    language: 'en-US',
    error: null,
    commandDetected: null
  });

  voiceState$ = this.voiceState.asObservable();

  // Nordic languages and English
  supportedLanguages: { [key: string]: string } = {
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'nb-NO': 'Norwegian Bokmål',
    'nn-NO': 'Norwegian Nynorsk',
    'sv-SE': 'Swedish',
    'da-DK': 'Danish',
    'fi-FI': 'Finnish',
    'is-IS': 'Icelandic'
  };

  constructor() {
    this.initializeWebSpeechAPI();
  }

  // Get user's browser language as default
  getDefaultLanguage(): string {
    const browserLang = navigator.language || 'en-US';
    // Check if browser language is supported
    if (this.supportedLanguages[browserLang]) {
      return browserLang;
    }
    // Try to match language prefix
    const langPrefix = browserLang.split('-')[0];
    const matchedLang = Object.keys(this.supportedLanguages).find(key => key.startsWith(langPrefix + '-'));
    // Default to English US if no match
    return matchedLang || 'en-US';
  }

  private initializeWebSpeechAPI(): void {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.setupRecognitionListeners();
      console.log('Speech Recognition initialized');
    } else {
      console.warn('Speech Recognition API not supported');
    }
  }


  private setupRecognitionListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('Recognition started');
      this.isListening = true;
      this.finalTranscript = ''; // Reset only the current session's transcript
      this.updateState({
        isRecording: true,
        error: null,
        isProcessing: false,
        // Keep transcript (savedTranscript) so the user sees prior text during recording
        interimTranscript: ''
      });
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';

      // Process ALL results from the beginning, not just from resultIndex
      // This is the key fix - we rebuild the final transcript each time
      this.finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          // Add to final transcript
          this.finalTranscript += transcript;
          console.log('Final:', transcript);
        } else {
          // This is interim (still being processed)
          interimTranscript += transcript;
          console.log('Interim:', transcript);
        }
      }

      // Build full transcript: saved text from previous sessions + current session
      const fullTranscript = this.savedTranscript
        ? (this.savedTranscript + ' ' + this.finalTranscript).trim()
        : this.finalTranscript.trim();

      // Detect voice commands in the combined transcript
      const command = this.detectCommand(fullTranscript);
      let cleanedTranscript = fullTranscript;

      console.log('[VOICE] Full transcript (saved + current):', fullTranscript);
      console.log('[VOICE] Command detected:', command);

      if (command) {
        // Remove the command word from transcript
        console.log('[VOICE] Before removing command:', cleanedTranscript);
        cleanedTranscript = this.removeCommand(fullTranscript);
        console.log('[VOICE] After removing command:', cleanedTranscript);
      }

      // Update state - show final + interim combined for display
      // But only store final in the actual transcript
      this.updateState({
        transcript: cleanedTranscript,
        interimTranscript: interimTranscript,
        isProcessing: interimTranscript.length > 0,
        commandDetected: command
      });

      console.log('[VOICE] State updated - commandDetected:', command, 'transcript:', cleanedTranscript);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);

      const errorMessages: { [key: string]: string } = {
        'network': 'Network error. Check your internet connection.',
        'audio-capture': 'No microphone found.',
        'not-allowed': 'Microphone access denied. Please allow access.',
      };

      // no-speech: browser found silence — suppress the error and let onend auto-restart
      if (event.error === 'no-speech') {
        return;
      }

      // aborted: caused by our own stopRecording() / intentionallyStopped — ignore
      if (event.error === 'aborted') {
        return;
      }

      // Fatal errors: mark as intentional so onend does NOT auto-restart
      if (['not-allowed', 'audio-capture', 'network'].includes(event.error)) {
        this.intentionallyStopped = true;
      }

      const errorMsg = errorMessages[event.error] || `Error: ${event.error}`;
      this.updateState({
        error: errorMsg,
        isRecording: false,
        isProcessing: false
      });
      this.isListening = false;
    };

    this.recognition.onend = () => {
      console.log('Recognition ended');

      const shouldRestart = !this.intentionallyStopped;
      this.intentionallyStopped = false;
      this.isListening = false;

      // Save the transcript here — onend fires AFTER all onresult final calls,
      // so this captures the fully-finalized text (including last-second words).
      // Only save when transcript is non-empty: an empty transcript means
      // clearTranscript() already ran (e.g. after a send), so we don't overwrite.
      const finalizedTranscript = this.voiceState.value.transcript;
      if (finalizedTranscript) {
        this.savedTranscript = finalizedTranscript;
      }

      if (shouldRestart) {
        // Keep isRecording: true so the button stays lit — the user didn't stop.
        // Only clear interim state while the engine briefly re-initialises.
        this.updateState({
          isProcessing: false,
          interimTranscript: '',
          commandDetected: null
        });
        const { language } = this.voiceState.value;
        this.autoRestartTimeout = setTimeout(() => {
          this.autoRestartTimeout = null;
          this.startRecording(language);
        }, 300);
      } else {
        // Intentional stop — reflect that in the UI
        this.updateState({
          isRecording: false,
          isProcessing: false,
          interimTranscript: '',
          commandDetected: null
        });
      }
    };
  }

  startRecording(language: string = 'en-US'): void {
    if (!this.recognition) {
      this.updateState({
        error: 'Speech Recognition not supported. Use Chrome or Edge.'
      });
      return;
    }

    if (this.isListening) {
      console.log('Already recording');
      return;
    }

    try {
      this.recognition.lang = language;

      // Reset only the current session; keep savedTranscript for resume
      this.finalTranscript = '';

      this.updateState({
        isRecording: true,
        interimTranscript: '',
        error: null,
        language
      });

      // Start recognition
      this.recognition.start();
      console.log('Started recording, language:', language);

    } catch (error: any) {
      console.error('Error starting:', error);

      if (error.message?.includes('already started')) {
        this.recognition.stop();
        setTimeout(() => this.startRecording(language), 300);
        return;
      }

      this.updateState({
        error: 'Failed to start recording',
        isRecording: false
      });
    }
  }

  stopRecording(): void {
    console.log('Stopping recording...');

    // Cancel any pending auto-restart before marking as intentional stop
    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
      this.autoRestartTimeout = null;
    }
    this.intentionallyStopped = true;

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping:', error);
      }
    }

    this.isListening = false;
    this.updateState({
      isRecording: false,
      isProcessing: false,
      interimTranscript: ''
    });
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  isRecording(): boolean {
    return this.isListening;
  }

  getTranscript(): string {
    return this.voiceState.value.transcript;
  }

  // Get combined transcript (final + interim) for display
  getDisplayTranscript(): string {
    const state = this.voiceState.value;
    if (state.interimTranscript) {
      return (state.transcript + ' ' + state.interimTranscript).trim();
    }
    return state.transcript;
  }

  clearTranscript(): void {
    this.finalTranscript = '';
    this.savedTranscript = ''; // Also clear saved so next recording starts fresh
    this.updateState({
      transcript: '',
      interimTranscript: '',
      error: null,
      commandDetected: null
    });
  }

  /**
   * Detect voice commands in transcript
   * Commands: ask Fabrioo (sends message)
   */
  private detectCommand(transcript: string): 'SEND' | null {
    // Remove punctuation and extra spaces, then convert to uppercase
    const text = transcript.trim().replace(/[.,!?;:]+$/, '').trim().toUpperCase();

    console.log('[DETECT] Checking text for commands:', text);

    // Check if transcript ends with "ask <anything starting with fab>"
    if (/\bASK\s+FAB\w*$/i.test(text)) {
      console.log('[DETECT] Matched ask Fab* command');
      return 'SEND';
    }

    console.log('[DETECT] No command matched');
    return null;
  }

  /**
   * Remove command word from transcript
   */
  private removeCommand(transcript: string): string {
    // Strip trailing punctuation first (same normalization as detectCommand)
    const normalized = transcript.trim().replace(/[.,!?;:]+$/, '').trim();

    const result = normalized.replace(/\s*\bask\s+fab\w*\s*$/i, '').trim();
    console.log('[REMOVE] Input:', transcript, '-> Normalized:', normalized, '-> Output:', result);
    return result;
  }

  getSupportedLanguages(): { [key: string]: string } {
    return this.supportedLanguages;
  }

  private updateState(partial: Partial<VoiceState>): void {
    this.voiceState.next({
      ...this.voiceState.value,
      ...partial
    });
  }
}
