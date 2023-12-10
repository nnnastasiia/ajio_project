import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { components } from './components';

// import { ScannerPageRoutingModule } from './scanner-page-routing.module';
@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [...components],
  exports: [...components],
})
export class ScannerPageModule {}
