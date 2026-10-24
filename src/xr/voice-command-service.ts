/**
 * FactoryVerse Expert XR - Hands-Free Voice Command Service
 * Web Speech API integration enabling hands-free procedure navigation
 * in factory environments where operators wear gloves or hold tools.
 */

export type VoiceCommandHandler = (command: string) => void;

export class VoiceCommandService {
  private recognition: any = null;
  private isListening = false;
  private isSupported = false;
  private handlers: Set<VoiceCommandHandler> = new Set();
  private lastRecognized = '';

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript.trim().toLowerCase();
          this.lastRecognized = transcript;
          this.processCommand(transcript);
        };

        this.recognition.onerror = (err: any) => {
          console.warn('[VoiceCommand] Speech recognition event:', err?.error || err);
        };

        this.recognition.onend = () => {
          // Auto restart if user still enabled listening
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch {
              // Ignore restart collision
            }
          }
        };
      }
    }
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getLastTranscript(): string {
    return this.lastRecognized;
  }

  public start(): boolean {
    if (!this.isSupported || !this.recognition) return false;
    try {
      this.isListening = true;
      this.recognition.start();
      return true;
    } catch {
      return false;
    }
  }

  public stop(): void {
    if (!this.recognition) return;
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch {
      // Ignore
    }
  }

  public toggle(): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      return this.start();
    }
  }

  public addListener(handler: VoiceCommandHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private processCommand(transcript: string): void {
    let matchedCommand = '';

    if (
      transcript.includes('next') ||
      transcript.includes('forward') ||
      transcript.includes('lanjut')
    ) {
      matchedCommand = 'next';
    } else if (
      transcript.includes('back') ||
      transcript.includes('previous') ||
      transcript.includes('kembali')
    ) {
      matchedCommand = 'previous';
    } else if (
      transcript.includes('reset') ||
      transcript.includes('restart') ||
      transcript.includes('ulangi')
    ) {
      matchedCommand = 'reset';
    } else if (
      transcript.includes('pass') ||
      transcript.includes('measure') ||
      transcript.includes('verify') ||
      transcript.includes('nominal')
    ) {
      matchedCommand = 'pass';
    } else if (
      transcript.includes('fail') ||
      transcript.includes('reject')
    ) {
      matchedCommand = 'fail';
    }

    if (matchedCommand) {
      this.handlers.forEach((h) => h(matchedCommand));
    }
  }
}

export const voiceCommandService = new VoiceCommandService();
