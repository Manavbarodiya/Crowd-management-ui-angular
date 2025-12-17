import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Alert {
  actionType: string;
  zone: string;
  site: string;
  severity: string;
  timestamp: number | string;
  message: string;
  raw: any;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private alerts: Alert[] = [];
  private alertsSubject = new Subject<Alert[]>();
  public alerts$ = this.alertsSubject.asObservable();
  private readonly MAX_ALERTS = 50;

  addAlert(alert: Alert): void {
    this.alerts.unshift(alert);
    // Limit alerts to prevent memory issues
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, this.MAX_ALERTS);
    }
    // Emit a new array reference to trigger change detection in OnPush components
    this.alertsSubject.next([...this.alerts]);
  }

  getAlerts(): Alert[] {
    // Return reference directly for OnPush components (they track changes via subscription)
    return this.alerts;
  }

  getUnreadCount(): number {
    return this.alerts.length;
  }

  clearAlerts(): void {
    this.alerts = [];
    this.alertsSubject.next([]);
  }
}

