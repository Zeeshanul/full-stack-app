import { Component } from '@angular/core';
import { UsersService } from '../users';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  users: any[] = [];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  editingUserId = false;

  loadUsers() {
    this.usersService.getUsers().subscribe({
      next: (data) => {
        this.users = [...data];
      },
      error: (err) => {
        console.error('Error loading users:', err);
      },
    });
  }

  saveUser() {
    const payload = {
      name: this.newUser.name,
      email: this.newUser.email,
    };

    this.usersService.createUser(payload).subscribe({
      next: (createdUser) => {
        // add new user to table instantly
        this.users.push(createdUser);

        this.closeModal();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error creating user:', err);
      },
    });
  }

  isModalOpen = false;

  newUser = {
    name: '',
    email: '',
    role: '',
  };

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetForm();
  }

  resetForm() {
    this.newUser = {
      name: '',
      email: '',
      role: '',
    };
  }

  editUser(user: any) {
    this.isModalOpen = true;

    this.newUser = {
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  deleteUser(id: number) {
    this.users = this.users.filter((u) => u.id !== id);
  }
}
