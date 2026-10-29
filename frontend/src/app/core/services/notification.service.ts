import { Injectable, inject, PLATFORM_ID, effect, signal, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Client, Message } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  date: Date;
  read: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private http = inject(HttpClient);
  
  private stompClient: Client | null = null;
  private messageSubject = new Subject<any>();
  public messages$ = this.messageSubject.asObservable();

  // Liste des notifications en mémoire
  notifications = signal<NotificationItem[]>([]);
  unreadCount = signal(0);

  private connectionStatus = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.connectionStatus.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const user = this.authService.currentUser();
        console.log('NotificationService: currentUser changed', user?.email);
        if (user) {
          this.loadHistory();
          this.connect();
        } else {
          this.disconnect();
          this.notifications.set([]);
          this.unreadCount.set(0);
        }
      });
    }
  }

  private loadHistory() {
    const baseUrl = environment.apiUrl;
    // Notifications persistées (centre de notifications)
    this.http.get<any[]>(`${baseUrl}/notifications`).subscribe({
      next: (notifs) => {
        const history: NotificationItem[] = notifs.map(n => ({
          id: n.id.toString(),
          type: n.type,
          message: n.message,
          date: new Date(n.createdAt),
          read: n.lu || false,
          data: n
        }));
        this.notifications.set(history);
        this.unreadCount.set(history.filter(n => !n.read).length);
      },
      error: (err) => console.error('Erreur chargement notifications:', err)
    });
  }

  private addNotification(payload: any) {
    console.log('Adding notification to list:', payload);
    
    // Émettre pour les Toasts
    this.messageSubject.next(payload);

    const newItem: NotificationItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: payload.type || 'INFO',
      message: payload.message || 'Nouvelle notification',
      date: new Date(),
      read: false,
      data: payload
    };
    this.notifications.update(list => {
      const newList = [newItem, ...list];
      console.log('New notifications list size:', newList.length);
      return newList;
    });
    this.unreadCount.update(c => c + 1);
    
    // Notification sonore désactivée tant que le fichier assets/notification.mp3 n'est pas présent
    /*
    try {
      const audio = new Audio('assets/notification.mp3');
      audio.play().catch(e => console.warn('Erreur lecture audio notification:', e));
    } catch (e) {}
    */
  }

  markAllAsRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.unreadCount.set(0);
    const baseUrl = environment.apiUrl;
    this.http.patch(`${baseUrl}/notifications/lu-tout`, {}).subscribe({ error: () => {} });
  }

  clearAll() {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  private async connect() {
    if (this.stompClient?.active) {
      console.log('STOMP: already connected or connecting');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('STOMP: No token found, cannot connect');
      return;
    }

    try {
      const SockJS_ = await import('sockjs-client');
      const SockJS = (SockJS_ as any).default || SockJS_;

      const baseUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
      console.log('STOMP: Connecting to', `${baseUrl}/ws`);
      
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => console.log('STOMP: ' + str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.stompClient.onConnect = (frame) => {
        this.connectionStatus.next(true);
        console.log('WebSocket Connected Successfully', frame);

        this.stompClient?.subscribe('/user/queue/messages', (message: Message) => {
          this.ngZone.run(() => {
            console.log('RECEIVED MESSAGE from /user/queue/messages:', message.body);
            try {
              const payload = JSON.parse(message.body);
              this.messageSubject.next(payload);
              this.addNotification({
                type: 'MESSAGE',
                message: `Nouveau message de ${payload.expediteur?.prenom || 'quelqu\'un'}`,
                ...payload
              });
            } catch (e) {
              console.error('Error parsing message body:', e);
            }
          });
        });

        this.stompClient?.subscribe('/user/queue/notifications', (message: Message) => {
          this.ngZone.run(() => {
            console.log('RECEIVED NOTIFICATION from /user/queue/notifications:', message.body);
            try {
              this.addNotification(JSON.parse(message.body));
            } catch (e) {
              console.error('Error parsing notification body:', e);
            }
          });
        });

        const isAdmin = this.authService.isAdmin();
        console.log('STOMP: Is Admin?', isAdmin);
        if (isAdmin) {
          this.stompClient?.subscribe('/topic/admin/notifications', (message: Message) => {
            this.ngZone.run(() => {
              console.log('RECEIVED ADMIN NOTIFICATION:', message.body);
              try {
                this.addNotification(JSON.parse(message.body));
              } catch (e) {
                console.error('Error parsing admin notification body:', e);
              }
            });
          });
        }
      };

      this.stompClient.onStompError = (frame) => {
        console.error('STOMP error', frame);
      };

      this.stompClient.activate();
    } catch (err) {
      console.error('Failed to load SockJS', err);
    }
  }

  private disconnect() {
    if (this.stompClient) {
      console.log('STOMP: Deactivating client');
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connectionStatus.next(false);
    }
  }
}

