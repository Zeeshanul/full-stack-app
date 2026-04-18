import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Base } from './components/base/base';

const routes: Routes = [
  {
    path: '',
    component: Base,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../home/home-module').then(m => m.HomeModule)
      },
      {
        path: 'users',
        loadChildren: () =>
          import('../users/users-module').then(m => m.UsersModule)
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShellRoutingModule {}