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
        title: 'Dashboard | PeoplePulse',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard],
      },
      {
        path: 'employees',
        title: 'Employees | PeoplePulse',
        loadComponent: () => import('./pages/employees/employees.component').then(m => m.EmployeesComponent),
        canActivate: [authGuard],
      },
      {
        path: 'departments',
        title: 'Departments | PeoplePulse',
        loadComponent: () => import('./pages/departments/departments.component').then(m => m.DepartmentsComponent),
        canActivate: [authGuard],
      },
      {
        path: 'leaves',
        title: 'Leave Requests | PeoplePulse',
        loadComponent: () => import('./pages/leaves/leaves.component').then(m => m.LeavesComponent),
        canActivate: [authGuard],
      },
      {
        path: 'attendance',
        title: 'Attendance | PeoplePulse',
        loadComponent: () => import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent),
        canActivate: [authGuard],
      },
      {
        path: 'regularizations',
        title: 'Regularizations | PeoplePulse',
        loadComponent: () => import('./pages/regularizations/regularizations.component').then(m => m.RegularizationsComponent),
        canActivate: [authGuard],
      },
      {
        path: 'holidays',
        title: 'Holidays | PeoplePulse',
        loadComponent: () => import('./pages/holidays/holidays.component').then(m => m.HolidaysComponent),
        canActivate: [authGuard],
      },
      {
        path: 'my-account',
        title: 'My Account | PeoplePulse',
        loadComponent: () => import('./pages/my-profile/my-profile.component').then(m => m.MyProfileComponent),
        canActivate: [authGuard],
      },
      {
        path: 'projects',
        title: 'All Projects | PeoplePulse',
        loadComponent: () => import('./pages/projects/projects.component').then(m => m.ProjectsComponent),
        canActivate: [authGuard],
      },
      {
        path: 'projects/:id',
        title: 'Project Details | PeoplePulse',
        loadComponent: () => import('./pages/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
        canActivate: [authGuard],
      },
      {
        path: 'timesheets',
        title: 'Timesheet | PeoplePulse',
        loadComponent: () => import('./pages/timesheets/timesheets.component').then(m => m.TimesheetsComponent),
        canActivate: [authGuard],
      },
    ]
  },
  {
    path: 'login',
    title: 'Login | PeoplePulse',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [unauthGuard], // Attach the guard here
  },
  {
    path: 'set-password',
    title: 'Set Password | PeoplePulse',
    loadComponent: () => import('./pages/set-password/set-password.component').then(m => m.SetPasswordComponent),
    canActivate: [unauthGuard], // Attach the guard here
  },
];