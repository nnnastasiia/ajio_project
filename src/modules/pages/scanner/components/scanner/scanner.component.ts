import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { BehaviorSubject, Observable } from 'rxjs';
import { createWorker, ImageLike, RecognizeResult, Worker } from 'tesseract.js';

import { adaptiveThreshold, blurARGB } from '../../util';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrl: './scanner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScannerComponent implements OnDestroy {
  @ViewChild('imageElement') imageElement!: ElementRef;
  // @ViewChild('preprocessImageElement') imagePreprocessElement!: ElementRef;

  private loader!: HTMLIonLoadingElement;

  protected workerOCR!: Worker;

  private _recognizedDate$: BehaviorSubject<string> = new BehaviorSubject('-');
  protected recognizedDate$: Observable<string> =
    this._recognizedDate$.asObservable();

  protected _recognizeSum$: BehaviorSubject<string> = new BehaviorSubject('-');
  protected recognizeSum$: Observable<string> =
    this._recognizeSum$.asObservable();

  protected noImage$ = new BehaviorSubject(true);

  constructor(private loadingCtrl: LoadingController) {
    this.createOCRWorker();
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
    });

    var imageDataUrl = image.dataUrl;
    this._recognizedDate$.next('-');
    this._recognizeSum$.next('-');
    this.noImage$.next(false);
    this.loader = await this.loadingCtrl.create({ message: 'Recognizing...' });
    this.loader.present();

    this.imageElement.nativeElement.src = imageDataUrl;

    const imageElement = await this.loadImage(imageDataUrl!);
    const preprocessedDataUrl = this.preprocessImage(imageElement);
    this.imageElement.nativeElement.src = preprocessedDataUrl;
    this.recognizeOCR(preprocessedDataUrl);
  }

  private preprocessImage(image: HTMLImageElement): string {
    const imageData = this.getPixelsFromImage(image);

    // Gaussian Blur
    blurARGB(imageData.data, image.width, image.height, 0.6);

    // adaptive Threshhold filter  / Binarization
    adaptiveThreshold(imageData.data, image.width, image.height, 30, 15);

    // Threshhold filter global / Binarization
    // threshold(imageData.data, 0.5);

    const preprocessedImageDataUrl = this.imageDataToDataUrl(
      imageData,
      image.width,
      image.height
    );

    return preprocessedImageDataUrl;
  }

  private imageDataToDataUrl(
    imageData: ImageData,
    width: number,
    height: number
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    context!.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
  }

  private getPixelsFromImage(image: HTMLImageElement): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d');
    context!.drawImage(image, 0, 0);

    return context!.getImageData(0, 0, canvas.width, canvas.height);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private async createOCRWorker() {
    this.workerOCR = await createWorker('eng'); // pol, ukr, eng
    this.workerOCR.setParameters({ user_defined_dpi: '300' });

    // ------------ eng
    // this.workerOCR.setParameters({
    //   tessedit_char_whitelist:
    //     "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.-=#$:!/' '",
    // });

    // ------------ pol
    this.workerOCR.setParameters({
      tessedit_char_whitelist:
        "0123456789AĄBCĆDEĘFGHIJKLŁMNOÓPQRSŚTUWXYZŹŻaąbcćdeęfghijkłmnoópqrsśtuvwxyzźż.,-=#$:!/' '",
    });
  }

  private async recognizeOCR(image: ImageLike) {
    const res = await this.workerOCR.recognize(image);
    console.log(res);
    this.parseFromOCR(res);
  }

  private parseFromOCR(res: RecognizeResult) {
    // Date extraction (YYYY-MM-DD pattern)
    const datePattern: RegExp = /\b(\d{4}-\d{2}-\d{2})\b/;
    const dateMatch: RegExpMatchArray | null = res.data.text.match(datePattern);
    const date: string | null = dateMatch ? dateMatch[1] : null;

    let totalSum = null;
    // Total sum extraction (line containing 'SUMA' and 'PLN')
    for (const line of res.data.lines) {
      if (
        line.text.toLowerCase().includes('suma') &&
        line.text.toLowerCase().includes('pln')
      ) {
        const totalSumMatch: RegExpMatchArray | null = line.text
          .toLowerCase()
          .match(/\b(\d+,\d+)\b/i);

        if (totalSumMatch) {
          totalSum = totalSumMatch[1].replace(',', '.');
          break;
        }
      }
    }

    this._recognizedDate$.next(date || 'unecognized');
    this._recognizeSum$.next(totalSum || 'unecognized');

    this.loader?.dismiss();
  }

  ngOnDestroy(): void {
    this.workerOCR.terminate();
  }
}
