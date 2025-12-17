import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loading = false;
  error = '';
  showPassword = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  togglePassword(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    const { email, password } = this.form.value;

    this.auth.login(email!, password!).subscribe({
      next: res => {
        if (res?.token) {
          this.router.navigate(['/']);
        } else {
          this.error = 'Login failed: No token received';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Login error details:', {
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          error: err.error,
          message: err.message
        });
        // Show more detailed error message
        if (err.status === 0) {
          this.error = 'Network error: Cannot connect to server. Make sure the dev server is running with proxy: ng serve';
        } else if (err.status === 401) {
          this.error = 'Invalid credentials';
        } else if (err.status === 404) {
          this.error = `API endpoint not found (404). URL: ${err.url || 'unknown'}. Make sure the dev server was restarted after adding proxy config.`;
        } else if (err.status >= 500) {
          this.error = 'Server error. Please try again later.';
        } else {
          this.error = err.error?.message || err.message || `Login failed (${err.status}). Please try again.`;
        }
        this.loading = false;
      }
    });
  }
}
