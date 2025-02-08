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
        loadComponent: () => import('./pages/employees/employees.component').then(m => m.EmployeesComponent),
        canActivate: [authGuard],
      },
      {
        path: 'departments',
        title: 'Departments',
        loadComponent: () => import('./pages/departments/departments.component').then(m => m.DepartmentsComponent),
        canActivate: [authGuard],
      },
      {
        path: 'leaves',
        title: 'Leave Requests',
        loadComponent: () => import('./pages/leaves/leaves.component').then(m => m.LeavesComponent),
        canActivate: [authGuard],
      },
      {
        path: 'attendance',
        title: 'Attendance',
        loadComponent: () => import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent),
        canActivate: [authGuard],
      },
      {
        path: 'regularizations',
        title: 'Regularizations',
        loadComponent: () => import('./pages/regularizations/regularizations.component').then(m => m.RegularizationsComponent),
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