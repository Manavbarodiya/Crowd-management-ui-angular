import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { clearCacheForSite } from '../interceptors/cache.interceptor';

@Injectable({ providedIn: 'root' })
export class SiteService {
  private siteChangeSubject = new Subject<string>();
  siteChange$ = this.siteChangeSubject.asObservable();

  notifySiteChange(siteId: string, previousSiteId?: string): void {
    // Clear all cache to ensure fresh data (clearing by siteId is redundant since we clear all)
    clearCacheForSite();
    // Emit the change event
    this.siteChangeSubject.next(siteId);
  }
}

