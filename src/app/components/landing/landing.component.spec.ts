import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
  });

  it('should define default highlights with translation keys', () => {
    expect(component.highlights.length).toBe(3);
    expect(component.highlights[0]).toEqual(jasmine.objectContaining({
      title: 'highlight1_title',
      description: 'highlight1_desc',
      icon: 'fa-trophy',
    }));
  });

  it('should expose testimonials for landing page', () => {
    expect(component.testimonials.length).toBeGreaterThan(0);
    expect(component.testimonials[0]).toEqual(jasmine.objectContaining({
      quote: 'testimonial1_quote',
      name: 'testimonial1_name',
      role: 'testimonial1_role',
    }));
  });
});
