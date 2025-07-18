import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CounterRoutingModule } from './counter-routing-module';
import { Counter } from './counter';
import { SmartCounterComponent } from './components/smart-counter-component/smart-counter-component';


@NgModule({
  declarations: [
    Counter,
    SmartCounterComponent
  ],
  imports: [
    CommonModule,
    CounterRoutingModule
  ]
})
export class CounterModule { }
