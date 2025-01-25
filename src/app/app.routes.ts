import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { unauthGuard } from './core/unauth.guard';

export const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: '/login',
  //   pathMatch: 'full'
  // },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./components/auth-component/auth.component').then(m => m.AuthComponent),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard],
      },
      {
        path: 'employees',
        title: 'Employees',
        loadComponent: () => import('./pages/employee/employee.module').then(m => m.EmployeeModule),
        canActivate: [authGuard],
      },
    ]
  },
  {
    path: 'login',
    title: 'Login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [unauthGuard], // Attach the guard here
  },
  {
    path: 'set-password',
    title: 'Set Password',
    loadComponent: () => import('./pages/set-password/set-password.component').then(m => m.SetPasswordComponent),
    canActivate: [unauthGuard], // Attach the guard here
  },
];