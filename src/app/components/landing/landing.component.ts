import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';

interface LandingHighlight {
  titleKey: string;
  descriptionKey: string;
  icon: string;
}

interface Testimonial {
  quoteKey: string;
  nameKey: string;
  roleKey: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  readonly highlights: LandingHighlight[] = [
    {
      titleKey: 'landing_highlight_management_title',
      descriptionKey: 'landing_highlight_management_description',
      icon: 'fa-trophy'
    },
    {
      titleKey: 'landing_highlight_tracking_title',
      descriptionKey: 'landing_highlight_tracking_description',
      icon: 'fa-bolt'
    },
    {
      titleKey: 'landing_highlight_insights_title',
      descriptionKey: 'landing_highlight_insights_description',
      icon: 'fa-line-chart'
    }
  ];

  readonly testimonials: Testimonial[] = [
    {
      quoteKey: 'landing_testimonial_1_quote',
      nameKey: 'landing_testimonial_1_name',
      roleKey: 'landing_testimonial_1_role'
    },
    {
      quoteKey: 'landing_testimonial_2_quote',
      nameKey: 'landing_testimonial_2_name',
      roleKey: 'landing_testimonial_2_role'
    }
  ];
}
