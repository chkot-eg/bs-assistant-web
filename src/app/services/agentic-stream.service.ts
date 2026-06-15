import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SseEvent, SseEventType } from '../models/sse-events.model';
import { UserMappingService } from './user-mapping.service';

@Injectable({ providedIn: 'root' })
export class AgenticStreamService {
  private apiUrl = environment.apiUrl;

  constructor(
    private ngZone: NgZone,
    private userMappingService: UserMappingService
  ) {}

  connectStream(params: {
    query: string;
    library?: string;
    sessionId?: string;
    maxIterations?: number;
    responseFormat?: 'html' | 'markdown';
  }): Observable<SseEvent> {
    return new Observable(observer => {
      const url = new URL(`${window.location.origin}${this.apiUrl}/api/v1/query/agentic/stream`);
      url.searchParams.set('query', params.query);
      // Use the ERP library from user mapping — falls back to explicit param or env default
      const library = this.userMappingService.library
        || params.library
        || environment.defaultLibrary;
      url.searchParams.set('library', library);
      if (params.sessionId) url.searchParams.set('sessionId', params.sessionId);
      if (params.maxIterations) url.searchParams.set('maxIterations', String(params.maxIterations));
      // When the caller asks for HTML, ask the backend to pre-convert the markdown-bearing
      // fields. Saves the client a marked.parse() round-trip and keeps server and client
      // in agreement about which dialect of markdown was rendered.
      if (params.responseFormat) url.searchParams.set('responseFormat', params.responseFormat);

      const eventSource = new EventSource(url.toString());

      const handleEvent = (eventName: SseEventType) => (event: MessageEvent) => {
        this.ngZone.run(() => {
          try {
            const data = JSON.parse(event.data);
            observer.next({ event: eventName, data });

            if (eventName === 'complete') {
              eventSource.close();
              observer.complete();
            }
          } catch (parseError) {
            console.error(`Failed to parse SSE ${eventName} data:`, event.data);
          }
        });
      };

      eventSource.addEventListener('init', handleEvent('init'));
      eventSource.addEventListener('progress', handleEvent('progress'));
      eventSource.addEventListener('step', handleEvent('step'));
      eventSource.addEventListener('context', handleEvent('context'));
      eventSource.addEventListener('synthesis', handleEvent('synthesis'));
      eventSource.addEventListener('complete', handleEvent('complete'));
      eventSource.addEventListener('limit', handleEvent('limit'));

      eventSource.addEventListener('error', (event: Event) => {
        this.ngZone.run(() => {
          if (event instanceof MessageEvent && event.data) {
            try {
              const data = JSON.parse(event.data);
              observer.error(data);
            } catch {
              observer.error({ error: 'SSE connection failed' });
            }
          } else {
            observer.error({ error: 'SSE connection lost' });
          }
          eventSource.close();
        });
      });

      return () => {
        eventSource.close();
      };
    });
  }
}
