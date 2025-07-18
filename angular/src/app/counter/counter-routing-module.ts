import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SmartCounterComponent } from './components/smart-counter-component/smart-counter-component';

const routes: Routes = [{ path: '', component: SmartCounterComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CounterRoutingModule { }
