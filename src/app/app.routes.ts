import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'people_that_come/automatic',
    pathMatch: 'full'
  },
  {
    path: 'people_that_come/manual',
    loadComponent: () => import('./people-that-come/people-that-come-manual.component').then(m => m.PeopleThatComeManualComponent)
  },
  {
    path: 'people_that_come/automatic',
    loadComponent: () => import('./people-that-come/people-that-come-automatic.component').then(m => m.PeopleThatComeAutomaticComponent)
  }
];
