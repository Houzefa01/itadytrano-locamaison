import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [Navbar, Footer, RouterOutlet],
  template: `
    <app-navbar />
    <main class="min-h-[60vh]"><router-outlet /></main>
    <app-footer />
  `,
})
export class PublicLayout {}
