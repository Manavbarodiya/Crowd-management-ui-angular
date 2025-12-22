import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService, Alert } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  showDropdown = false;
  alerts: (Alert & { _formattedTime?: string; _formattedDate?: string; _priority?: string })[] = [];
  unreadCount = 0;
  private subscription?: Subscription;
  // Cache for formatted times to avoid recalculating on every change detection
  private timeCache = new Map<string, string>();
  private dateCache = new Map<string, string>();
  private cacheTimeout = 60000; // Cache for 1 minute

  constructor(
    public notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to alert changes
    this.subscription = this.notificationService.alerts$.subscribe(() => {
      // Use filtered alerts based on selected date and pre-process them
      const rawAlerts = this.notificationService.getFilteredAlerts();
      this.alerts = rawAlerts.map(alert => ({
        ...alert,
        _formattedTime: this.formatAlertTime(alert.timestamp),
        _formattedDate: this.formatAlertDate(alert.timestamp),
        _priority: this.getPriorityLabel(alert.severity)
      }));
      this.unreadCount = this.notificationService.getFilteredUnreadCount();
      this.cdr.markForCheck();
    });
    
    // Initialize with filtered alerts and pre-process them
    const rawAlerts = this.notificationService.getFilteredAlerts();
    this.alerts = rawAlerts.map(alert => ({
      ...alert,
      _formattedTime: this.formatAlertTime(alert.timestamp),
      _formattedDate: this.formatAlertDate(alert.timestamp),
      _priority: this.getPriorityLabel(alert.severity)
    }));
    this.unreadCount = this.notificationService.getFilteredUnreadCount();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.timeCache.clear();
    this.dateCache.clear();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    this.cdr.markForCheck();
  }

  closeDropdown(): void {
    this.showDropdown = false;
    this.cdr.markForCheck();
  }

  formatAlertTime(timestamp: number | string): string {
    const cacheKey = String(timestamp);
    const cached = this.timeCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp);
      if (isNaN(date.getTime())) {
        const result = 'Invalid time';
        this.timeCache.set(cacheKey, result);
        return result;
      }
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);

      let result: string;
      if (diffSecs < 10) {
        result = 'Just now';
      } else if (diffSecs < 60) {
        result = `${diffSecs}s ago`;
      } else if (diffMins < 60) {
        result = `${diffMins}m ago`;
      } else {
        result = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      
      this.timeCache.set(cacheKey, result);
      // Clear cache after timeout to refresh relative times
      setTimeout(() => this.timeCache.delete(cacheKey), this.cacheTimeout);
      return result;
    } catch (err) {
      console.error('❌ NotificationBell: Error formatting alert time:', {
        error: err,
        timestamp: timestamp,
        timestampType: new Date().toISOString()
      });
      const result = 'Invalid time';
      this.timeCache.set(cacheKey, result);
      return result;
    }
  }

  formatAlertDate(timestamp: number | string): string {
    const cacheKey = String(timestamp);
    const cached = this.dateCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp);
      if (isNaN(date.getTime())) {
        const result = 'Invalid date';
        this.dateCache.set(cacheKey, result);
        return result;
      }

      // Format: "March 03 2025 10:12"
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      const month = months[date.getMonth()];
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      const result = `${month} ${day} ${year} ${hours}:${minutes}`;
      this.dateCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.error('❌ NotificationBell: Error formatting alert date:', {
        error: err,
        timestamp: timestamp
      });
      const result = 'Invalid date';
      this.dateCache.set(cacheKey, result);
      return result;
    }
  }

  getPriorityLabel(severity: string): string {
    // Map severity to priority labels (High/Medium/Low)
    const severityLower = severity?.toLowerCase() || '';
    if (severityLower === 'high' || severityLower === 'critical') {
      return 'High';
    } else if (severityLower === 'medium') {
      return 'Medium';
    } else {
      return 'Low';
    }
  }


  trackByAlertId(index: number, alert: Alert): string {
    return alert.raw?.eventId || alert.timestamp?.toString() || index.toString();
  }
}

