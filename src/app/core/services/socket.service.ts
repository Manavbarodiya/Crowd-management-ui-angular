import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, share } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private isInitializing = false;
  private eventSubjects: Map<string, Subject<any>> = new Map();

  constructor(private auth: AuthService) {}

  private initializeSocket(): void {
    if (this.isInitializing || this.socket?.connected) {
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      console.warn('⚠️ SocketService: Cannot initialize socket - no token available');
      return;
    }

    // Check if token is expired before attempting connection
    if (this.auth.isTokenExpired()) {
      console.warn('⚠️ SocketService: Cannot initialize socket - token expired:', {
        expiration: this.auth.getTokenExpiration(),
        timeUntilExpiration: this.auth.getTimeUntilExpiration(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    this.isInitializing = true;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    // Use environment API URL or fallback to backend API server
    // In development, proxy handles /api routes, but socket.io needs direct connection
    let socketUrl = environment.apiUrl;
    if (!socketUrl || socketUrl === '') {
      // Fallback to backend API server (matches proxy.conf.json target)
      socketUrl = 'https://hiring-dev.internal.kloudspot.com';
    }
    // Remove trailing slash if present
    socketUrl = socketUrl.replace(/\/$/, '');
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Try websocket first for better performance
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000, // 10 second connection timeout (reduced for faster failure detection)
      path: '/socket.io/', // Default socket.io path
      withCredentials: true, // For cross-origin connections
      forceNew: false, // Reuse existing connection if available
      auth: {
        token: token
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
      // Note: extraHeaders applies to both websocket and polling transports
    });

    this.socket.on('connect', () => {
      this.isInitializing = false;
      console.log('✅ Socket.IO connected successfully');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Socket.IO connection error:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context,
        transport: error.transport,
        timestamp: new Date().toISOString()
      });
      this.isInitializing = false;
      
      // If error is due to authentication, check token expiration
      if (error.message?.includes('auth') || error.message?.includes('token') || error.message?.includes('401') || error.message?.includes('403')) {
        if (this.auth.isTokenExpired()) {
          console.warn('⚠️ Socket.IO: Connection failed due to expired token');
        }
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket.IO disconnected:', {
        reason: reason,
        timestamp: new Date().toISOString()
      });
      this.isInitializing = false;
      
      // If disconnected due to authentication issues, don't auto-reconnect if token is expired
      if (reason === 'io server disconnect' || reason === 'transport close') {
        if (this.auth.isTokenExpired()) {
          console.warn('⚠️ Socket.IO: Not reconnecting - token expired');
        }
      }
    });
  }

  reconnect(): void {
    if (this.socket?.connected) {
      return;
    }
    
    // Check token before attempting reconnection
    const token = this.auth.getToken();
    if (!token || this.auth.isTokenExpired()) {
      console.warn('⚠️ SocketService: Cannot reconnect - token missing or expired');
      return;
    }
    
    this.initializeSocket();
  }

  listen(event: string): Observable<any> {
    // Shared observable pattern: one socket listener per event, multiple subscribers share the same observable
    if (!this.eventSubjects.has(event)) {
      const subject = new Subject<any>();
      this.eventSubjects.set(event, subject);

      const setupListener = () => {
        if (!this.socket) return;
        this.socket.off(event);
        this.socket.on(event, (data: any) => {
          subject.next(data);
        });
      };

      if (!this.socket && !this.isInitializing) {
        // Check token before initializing
        const token = this.auth.getToken();
        if (token && !this.auth.isTokenExpired()) {
          this.initializeSocket();
        } else {
          console.warn('⚠️ SocketService: Cannot setup listener - token missing or expired');
        }
      }

      if (this.socket?.connected) {
        setupListener();
      } else if (this.socket) {
        const connectHandler = () => {
          setupListener();
          if (this.socket) {
            this.socket.off('connect', connectHandler);
          }
        };
        this.socket.on('connect', connectHandler);
      } else {
        // Wait for socket initialization using a retry mechanism
        const checkConnection = () => {
          if (this.socket?.connected) {
            setupListener();
          } else if (this.socket) {
            const connectHandler = () => {
              setupListener();
              if (this.socket) {
                this.socket.off('connect', connectHandler);
              }
            };
            this.socket.on('connect', connectHandler);
          } else {
            // Retry after a short delay if socket is still initializing
            requestAnimationFrame(() => {
              if (this.socket && !this.socket.connected) {
                setTimeout(checkConnection, 100);
              }
            });
          }
        };
        checkConnection();
      }
    }

    return this.eventSubjects.get(event)!.asObservable().pipe(share());
  }

  /**
   * Check if socket connection is healthy (connected and token is valid)
   */
  isConnectionHealthy(): boolean {
    if (!this.socket?.connected) {
      return false;
    }
    
    const token = this.auth.getToken();
    if (!token || this.auth.isTokenExpired()) {
      return false;
    }
    
    return true;
  }

  /**
   * Get connection status information
   */
  getConnectionStatus(): {
    connected: boolean;
    tokenValid: boolean;
    tokenExpired: boolean;
    timeUntilExpiration: number;
  } {
    const token = this.auth.getToken();
    const tokenExpired = !token || this.auth.isTokenExpired();
    
    return {
      connected: this.socket?.connected || false,
      tokenValid: !!token && !tokenExpired,
      tokenExpired: tokenExpired,
      timeUntilExpiration: this.auth.getTimeUntilExpiration()
    };
  }

  disconnect(): void {
    this.eventSubjects.forEach(subject => subject.complete());
    this.eventSubjects.clear();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isInitializing = false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
