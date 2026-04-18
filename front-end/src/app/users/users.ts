import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl =
    'http://fullstack-backend-alb-1813745378.us-east-1.elb.amazonaws.com/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createUser(user: any) {
    return this.http.post(
      'http://fullstack-backend-alb-1813745378.us-east-1.elb.amazonaws.com/users',
      user,
    );
  }
}
