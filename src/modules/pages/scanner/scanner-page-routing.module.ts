import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import * as fromComponents from './components';

const routes: Routes = [
  {
    path: '',
    component: fromComponents.ScannerComponent,
  },
];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forChild(routes)],
})
export class ScannerPageRoutingModule {}
