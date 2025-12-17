import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { SiteService } from '../core/services/site.service';
import { NotificationBellComponent } from '../shared/components/notification-bell/notification-bell.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    NotificationBellComponent
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentLang = 'en';
  sites: any[] = [];
  selectedSite: any = null;
  showSiteDropdown = false;
  private subscriptions: Subscription[] = [];
  private clickListener?: (event: MouseEvent) => void;
  
  translations: { [key: string]: { [key: string]: string } } = {
    en: {
      overview: 'Overview',
      crowdEntries: 'Crowd Entries',
      logout: 'Logout'
    },
    hi: {
      overview: 'अवलोकन',
      crowdEntries: 'भीड़ प्रविष्टियाँ',
      logout: 'लॉग आउट'
    }
  };

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private siteService: SiteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSites();
    this.loadSelectedSite();
    
    this.clickListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.location-select')) {
        this.showSiteDropdown = false;
        this.cdr.markForCheck();
      }
    };
    document.addEventListener('click', this.clickListener);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  loadSites(): void {
    const sub = this.api.getSites().subscribe({
      next: (sites) => {
        this.sites = sites || [];
        this.loadSelectedSite();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading sites:', err);
        this.sites = [];
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.push(sub);
  }

  loadSelectedSite(): void {
    const currentSiteId = this.auth.getSiteId();
    if (currentSiteId && this.sites.length > 0) {
      this.selectedSite = this.sites.find(s => s.siteId === currentSiteId) || this.sites[0];
    } else if (this.sites.length > 0) {
      this.selectedSite = this.sites[0];
      if (this.selectedSite?.siteId) {
        this.auth.setSiteId(this.selectedSite.siteId);
      }
    }
  }

  toggleSiteDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSiteDropdown = !this.showSiteDropdown;
    this.cdr.markForCheck();
  }

  selectSite(site: any): void {
    if (site?.siteId) {
      const previousSiteId = this.auth.getSiteId();
      this.selectedSite = site;
      this.showSiteDropdown = false;
      this.auth.setSiteId(site.siteId);
      this.siteService.notifySiteChange(site.siteId, previousSiteId || undefined);
      this.cdr.markForCheck();
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  setLanguage(lang: string): void {
    this.currentLang = lang;
    this.cdr.markForCheck();
  }

  getTranslation(key: string): string {
    return this.translations[this.currentLang]?.[key] || key;
  }

  trackBySiteId(index: number, site: any): string {
    return site.siteId || index.toString();
  }
}
