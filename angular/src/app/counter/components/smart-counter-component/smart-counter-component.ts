import { Component } from '@angular/core';

@Component({
  selector: 'app-smart-counter-component',
  templateUrl: './smart-counter-component.html',
  styleUrl: './smart-counter-component.scss'
})
export class SmartCounterComponent {
    count = 0;

  increment(): void {
    this.count++;
  }

  decrement(): void {
    this.count--;
  }
}
