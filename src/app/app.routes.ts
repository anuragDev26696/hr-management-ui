import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    title: 'Login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'set-password',
    title: 'Set Password',
    loadComponent: () => import('./pages/set-password/set-password.component').then(m => m.SetPasswordComponent),
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'employees',
    title: 'Employees',
    loadComponent: () => import('./pages/employee/employee.module').then(m => m.EmployeeModule),
  },
];