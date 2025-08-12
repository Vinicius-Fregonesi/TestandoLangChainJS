import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Message } from '../models/message.models';
import { firstValueFrom } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  messages$ = this.messagesSubject.asObservable();

  private apiUrl = 'http://localhost:3000/chat';

  constructor(private http: HttpClient) { }

  sendMessage(userMessage: string): Promise<void> {
    const userMsg: Message = {
      content: userMessage,
      sender: 'user',
      timestamp: new Date()
    };

    this.messagesSubject.next([...this.messagesSubject.value, userMsg]);

    return firstValueFrom(this.http.post<{ response: string }>(this.apiUrl, { message: userMessage }))
      .then(res => {
        const botMsg: Message = {
          content: res.response,
          sender: 'bot',
          timestamp: new Date()
        };
        this.messagesSubject.next([...this.messagesSubject.value, botMsg]);
      })
      .catch(() => {
        const errorMsg: Message = {
          content: 'Erro ao se comunicar com o servidor.',
          sender: 'bot',
          timestamp: new Date()
        };
        this.messagesSubject.next([...this.messagesSubject.value, errorMsg]);
      });
  }


}
