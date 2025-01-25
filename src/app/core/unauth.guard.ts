import { inject } from '@angular/core';
import { CanDeactivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const unauthGuard: CanDeactivateFn<unknown> = (component, currentRoute, currentState, nextState) => {
  const auth = inject(AuthService).currentToken();
  const router = inject(Router);
  // Check if token and userId are invalid
  if (auth().token.trim() === '' || auth().userId.trim() === '') {
    console.log(auth().token, auth().userId);
    return true; // Allow deactivation, hence navigate away
  }
  router.navigate(['/']);  // If there is a valid token, redirect to the dashboard or home page
  return false;   // Block deactivation, as we're redirecting programmatically
};
