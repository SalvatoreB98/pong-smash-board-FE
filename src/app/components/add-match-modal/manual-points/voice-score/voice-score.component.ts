import { Component, EventEmitter, Output } from '@angular/core';
import { SHARED_IMPORTS } from '../../../../common/imports/shared.imports';

@Component({
  selector: 'app-voice-score',
  imports: [SHARED_IMPORTS],
  templateUrl: './voice-score.component.html',
  styleUrl: './voice-score.component.scss'
})

export class VoiceScoreComponent {
  recognition: any;
  listening = false;

  player1Points = 0;
  player2Points = 0;

  @Output() scoreChanged = new EventEmitter<{ p1: number; p2: number }>();

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'it-IT';
      this.recognition.continuous = true;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        console.log('Heard:', transcript);

        const numbers = transcript.match(/\d+/g);
        if (numbers) this.applyNumbers(numbers.map((n: string) => parseInt(n, 10)));
      };

      this.recognition.onerror = (err: any) => {
        console.error('Recognition error:', err);
      };
    } else {
      alert('Il tuo dispositivo non è compatibile con il riconoscimento vocale');
    }
  }

  toggleListening() {
    if (!this.recognition) return;

    if (this.listening) {
      this.recognition.stop();
      this.listening = false;
    } else {
      this.recognition.start();
      this.listening = true;
    }
  }

  private applyNumbers(nums: number[]) {
    // semplice logica: se viene detto 2 numeri li mette come punteggio
    if (nums.length === 2) {
      this.player1Points = nums[0];
      this.player2Points = nums[1];
      this.scoreChanged.emit({ p1: this.player1Points, p2: this.player2Points });
    }
    // se viene detto 1 numero solo → aggiorna player1
    else if (nums.length === 1) {
      this.player1Points = nums[0];
      this.scoreChanged.emit({ p1: this.player1Points, p2: this.player2Points });
    }
  }
}