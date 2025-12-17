import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { clearCacheForSite } from '../interceptors/cache.interceptor';

@Injectable({ providedIn: 'root' })
export class SiteService {
  private siteChangeSubject = new Subject<string>();
  siteChange$ = this.siteChangeSubject.asObservable();

  notifySiteChange(siteId: string, previousSiteId?: string): void {
    // Clear cache for both old and new sites to ensure fresh data
    if (previousSiteId) {
      clearCacheForSite(previousSiteId);
    }
    clearCacheForSite(siteId);
    // Also clear all cache to be safe
    clearCacheForSite();
    // Emit the change event
    this.siteChangeSubject.next(siteId);
  }
}

