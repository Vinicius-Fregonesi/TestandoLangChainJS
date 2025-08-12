import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent {
  userInput: string = '';
  isTyping: boolean = false;

  constructor(public chatService: ChatService) { }

  sendMessage(): void {
    const trimmedInput = this.userInput.trim();
    if (!trimmedInput) return;

    this.isTyping = true;

    this.chatService.sendMessage(trimmedInput).finally(() => {
      this.isTyping = false;
    });

    this.userInput = '';
  }
  formatStructuredResponse(content: string): string {
    const lines = content.split('\n');
    let html = '';
    let currentSection = '';

    for (let line of lines) {
      // Aplica negrito para **texto**
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      if (line.startsWith('RECOMENDAÇÃO PRINCIPAL:')) {
        html += `<h3>RECOMENDAÇÃO PRINCIPAL:</h3>`;
        currentSection = 'principal';
      } else if (line.startsWith('ALTERNATIVAS:')) {
        html += `<h3>ALTERNATIVAS:</h3><ul>`;
        currentSection = 'alternativas';
      } else if (line.startsWith('PERGUNTA:')) {
        html += `</ul><h3>PERGUNTA:</h3>`;
        currentSection = 'pergunta';
      } else {
        if (currentSection === 'alternativas' && line.match(/^\d+\)/)) {
          html += `<li>${line}</li>`;
        } else {
          html += `<p>${line}</p>`;
        }
      }
    }

    return html;
  }



}
