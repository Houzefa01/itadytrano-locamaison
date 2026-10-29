import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from './shared/components/toast/toast';
import { DialogHost } from './shared/components/dialog/dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastHost, DialogHost],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
