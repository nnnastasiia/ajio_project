import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ScannerPageModule } from '@pages/scanner';

import { Tab2PageRoutingModule } from './tab2-routing.module';
import { Tab2Page } from './tab2.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    Tab2PageRoutingModule,
    ScannerPageModule,
  ],
  declarations: [Tab2Page],
})
export class Tab2PageModule {}
