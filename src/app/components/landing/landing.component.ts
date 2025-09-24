import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface LandingHighlight {
  title: string;
  description: string;
  icon: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  readonly highlights: LandingHighlight[] = [
    {
      title: 'Gestione intuitiva delle competizioni',
      description:
        'Crea tornei a gironi o ad eliminazione, personalizza regole e lascia che la piattaforma pensi a calendario e classifiche.',
      icon: 'fa-trophy'
    },
    {
      title: 'Match tracking in tempo reale',
      description:
        'Aggiorna risultati e statistiche live, sincronizzati con tutti i dispositivi della tua squadra o del tuo club.',
      icon: 'fa-bolt'
    },
    {
      title: 'Insights da coach professionista',
      description:
        'Analizza performance, identifica i trend dei giocatori e prepara le prossime sfide con report visivi e smart analytics.',
      icon: 'fa-line-chart'
    }
  ];

  readonly testimonials: Testimonial[] = [
    {
      quote:
        '«Abbiamo ridotto del 60% il tempo speso a organizzare tornei weekend grazie a Pong Smash Board.»',
      name: 'Martina L.',
      role: 'Founder, Ping Pong Club Milano'
    },
    {
      quote: '«Statistiche live, ranking automatici e zero fogli Excel: finalmente posso concentrarmi sui giocatori.»',
      name: 'Luca P.',
      role: 'Coach Professionista'
    }
  ];
}
