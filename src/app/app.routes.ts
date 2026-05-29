import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'people_that_come',
    pathMatch: 'full'
  },
  {
    path: 'people_that_come',
    loadComponent: () => import('./people-that-come/people-that-come.component').then(m => m.PeopleThatComeComponent)
  }
];
