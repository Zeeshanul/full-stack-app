import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Users } from './users/users';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: '',
    component: Users
  }
];

@NgModule({
  declarations: [Users],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule
  ]
})
export class UsersModule {}