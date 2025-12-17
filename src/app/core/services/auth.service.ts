import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'ks_auth_token';
  private siteIdKey = 'ks_site_id';

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    const url = `${environment.apiUrl}/api/auth/login`;
    return this.http
      .post<any>(url, { email, password })
      .pipe(
        tap(res => {
          if (res?.token) {
            localStorage.setItem(this.tokenKey, res.token);
          }
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.siteIdKey);
  }

  getSiteId(): string | null {
    return localStorage.getItem(this.siteIdKey);
  }

  setSiteId(siteId: string): void {
    localStorage.setItem(this.siteIdKey, siteId);
  }
}
