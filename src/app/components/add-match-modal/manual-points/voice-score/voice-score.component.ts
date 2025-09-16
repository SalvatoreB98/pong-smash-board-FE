import { Component, EventEmitter, NgZone, Output } from '@angular/core';
import { SHARED_IMPORTS } from '../../../../common/imports/shared.imports';
import { Utils } from '../../../../utils/Utils';

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

  constructor(private ngZone: NgZone) {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'it-IT';
      this.recognition.continuous = true;
      this.recognition.interimResults = true; // ✅ risultati subito

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        console.log('Heard:', transcript);

        // trova numeri anche durante l'ascolto
        const numbers = Utils.parseNumbers(transcript);

        if (numbers && numbers.length > 0) {
          // forza Angular a rientrare nel ciclo di rilevamento cambi
          this.ngZone.run(() => {
            this.applyNumbers(numbers);
          });
        }
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
    if (nums.length >= 2) {
      this.player1Points = nums[0];
      this.player2Points = nums[1];
      this.ngZone.run(() => {
        this.scoreChanged.emit({ p1: this.player1Points, p2: this.player2Points });
      });
    }
  }
}