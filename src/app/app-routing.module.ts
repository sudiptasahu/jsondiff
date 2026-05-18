import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApiCompareComponent } from './components/api-compare.component';
import { JsonTextCompareComponent } from './components/json-text-compare.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'compare/apis' },
  { path: 'compare/apis', component: ApiCompareComponent },
  { path: 'compare/text', component: JsonTextCompareComponent },
  { path: '**', redirectTo: 'compare/apis' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
