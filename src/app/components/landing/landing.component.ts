import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';

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
  imports: [SHARED_IMPORTS, CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  readonly highlights: LandingHighlight[] = [
    {
      title: 'highlight1_title',
      description: 'highlight1_desc',
      icon: 'fa-trophy'
    },
    {
      title: 'highlight2_title',
      description: 'highlight2_desc',
      icon: 'fa-bolt'
    },
    {
      title: 'highlight3_title',
      description: 'highlight3_desc',
      icon: 'fa-line-chart'
    }
  ];

  readonly testimonials: Testimonial[] = [
    {
      quote: 'testimonial1_quote',
      name: 'testimonial1_name',
      role: 'testimonial1_role'
    },
    {
      quote: 'testimonial2_quote',
      name: 'testimonial2_name',
      role: 'testimonial2_role'
    }
  ];

}
