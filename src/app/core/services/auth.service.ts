import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp?: number;
  iat?: number;
  email?: string;
  name?: string;
  userId?: string;
  siteId?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'ks_auth_token';
  private siteIdKey = 'ks_site_id';
  private userKey = 'ks_user_info';
  private tokenExpirationCache: number | null = null;

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    const url = `${environment.apiUrl}/api/auth/login`;
    return this.http
      .post<any>(url, { email, password })
      .pipe(
        tap({
          next: (res) => {
            if (res?.token) {
              localStorage.setItem(this.tokenKey, res.token);
              // Clear token expiration cache to force recalculation
              this.tokenExpirationCache = null;
              
              // Try to get user info from token first, then fall back to response
              const tokenUser = this.getUserFromToken();
              if (tokenUser && (tokenUser.email || tokenUser.name)) {
                const userInfo = {
                  email: tokenUser.email || email,
                  name: tokenUser.name || email.split('@')[0],
                  imageUrl: res.imageUrl || res.user?.imageUrl || res.avatar || res.user?.avatar || res.profileImage || res.user?.profileImage || null
                };
                localStorage.setItem(this.userKey, JSON.stringify(userInfo));
              } else if (res.user || res.email || res.name || res.username) {
                // Store user info if available in response
                const userInfo = {
                  email: res.email || res.user?.email || email,
                  name: res.name || res.user?.name || res.username || res.user?.username || email.split('@')[0],
                  imageUrl: res.imageUrl || res.user?.imageUrl || res.avatar || res.user?.avatar || res.profileImage || res.user?.profileImage || null
                };
                localStorage.setItem(this.userKey, JSON.stringify(userInfo));
              } else {
                // Store basic info from email
                const userInfo = {
                  email: email,
                  name: email.split('@')[0],
                  imageUrl: null
                };
                localStorage.setItem(this.userKey, JSON.stringify(userInfo));
              }
            } else {
              console.error('❌ Login response missing token:', res);
            }
          },
          error: (err) => {
            console.error('❌ AuthService login error:', {
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              error: err.error,
              url: url,
              timestamp: new Date().toISOString()
            });
          }
        })
      );
  }

  getUserInfo(): { email: string; name: string; imageUrl: string | null } | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Decode JWT token and return payload
   * Returns null if token is invalid or cannot be decoded
   */
  decodeToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.warn('⚠️ AuthService: Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Get token expiration timestamp in milliseconds
   * Returns null if token is invalid or has no expiration
   */
  getTokenExpiration(): number | null {
    // Use cached value if available and token hasn't changed
    if (this.tokenExpirationCache !== null) {
      return this.tokenExpirationCache;
    }

    const decoded = this.decodeToken();
    if (!decoded || !decoded.exp) {
      return null;
    }

    // Convert expiration (seconds) to milliseconds
    this.tokenExpirationCache = decoded.exp * 1000;
    return this.tokenExpirationCache;
  }

  /**
   * Check if token is expired
   * Returns true if token is expired, invalid, or missing
   */
  isTokenExpired(): boolean {
    const expiration = this.getTokenExpiration();
    if (!expiration) {
      return true; // Consider invalid/missing tokens as expired
    }

    // Add 5 second buffer to account for clock skew and network delays
    const buffer = 5000;
    return Date.now() >= (expiration - buffer);
  }

  /**
   * Get time until token expires in milliseconds
   * Returns 0 if token is expired or invalid
   */
  getTimeUntilExpiration(): number {
    const expiration = this.getTokenExpiration();
    if (!expiration) {
      return 0;
    }

    const timeLeft = expiration - Date.now();
    return Math.max(0, timeLeft);
  }

  /**
   * Get user information from token payload
   * Falls back to stored user info if token doesn't contain user data
   */
  getUserFromToken(): { email?: string; name?: string; userId?: string } | null {
    const decoded = this.decodeToken();
    if (decoded && (decoded.email || decoded.name || decoded.userId)) {
      return {
        email: decoded.email,
        name: decoded.name,
        userId: decoded.userId
      };
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    // Check if token is expired
    return !this.isTokenExpired();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.siteIdKey);
    localStorage.removeItem(this.userKey);
    // Clear token expiration cache
    this.tokenExpirationCache = null;
  }

  getSiteId(): string | null {
    return localStorage.getItem(this.siteIdKey);
  }

  setSiteId(siteId: string): void {
    localStorage.setItem(this.siteIdKey, siteId);
  }
}
