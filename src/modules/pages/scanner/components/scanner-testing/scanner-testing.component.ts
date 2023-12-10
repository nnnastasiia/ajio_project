import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { RangeCustomEvent } from '@ionic/angular';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  from,
  map,
  Observable,
  Subject,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { createWorker, ImageLike, RecognizeResult, Worker } from 'tesseract.js';

import { adaptiveThreshold, blurARGB } from '../../util';

@Component({
  selector: 'app-scanner-testing',
  templateUrl: './scanner-testing.component.html',
  styleUrl: './scanner-testing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScannerTestingComponent implements OnInit, OnDestroy {
  @ViewChild('imageElement') imageElement!: ElementRef;

  private _currentImageDataUrl$: BehaviorSubject<string> = new BehaviorSubject(
    ''
  );

  private _gaussianBlurValue$: BehaviorSubject<number> = new BehaviorSubject(
    0.6
  );
  protected gaussianBlurValue$: Observable<number> = this._gaussianBlurValue$
    .asObservable()
    .pipe(distinctUntilChanged());

  private _thresholdSizeValue$: BehaviorSubject<number> = new BehaviorSubject(
    30
  );
  protected thresholdSizeValue$: Observable<number> = this._thresholdSizeValue$
    .asObservable()
    .pipe(distinctUntilChanged());

  private _thresholdCompensationValue$: BehaviorSubject<number> =
    new BehaviorSubject(15);
  protected thresholdCompensationValue$: Observable<number> =
    this._thresholdCompensationValue$
      .asObservable()
      .pipe(distinctUntilChanged());

  protected workerOCR!: Worker;

  private _recognizedDate$: BehaviorSubject<string> = new BehaviorSubject('');
  protected recognizedDate$ = this._recognizedDate$.asObservable();

  protected _recognizeSum$: BehaviorSubject<string> = new BehaviorSubject('');
  protected recognizeSum$ = this._recognizeSum$.asObservable();

  private clickRecognize$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.createOCRWorker();

    const processedDataUrl$ = this._currentImageDataUrl$.asObservable().pipe(
      takeUntil(this.destroy$),
      filter((data) => data.length > 0),
      switchMap((imageDataUrl: string) => {
        this.imageElement.nativeElement.src = imageDataUrl;

        return from(this.loadImage(imageDataUrl));
      }),
      switchMap((imageElement: HTMLImageElement) =>
        combineLatest([
          this.gaussianBlurValue$,
          this.thresholdSizeValue$,
          this.thresholdCompensationValue$,
        ]).pipe(
          map(([blur, size, compensation]) => {
            const preprocessedDataUrl = this.preprocessImage(
              imageElement,
              blur,
              size,
              compensation
            );

            this.imageElement.nativeElement.src = preprocessedDataUrl;

            return preprocessedDataUrl;
          })
        )
      )
    );

    const currentProcessedData$: BehaviorSubject<string> = new BehaviorSubject(
      ''
    );
    processedDataUrl$.subscribe((processedData) =>
      currentProcessedData$.next(processedData)
    );

    this.clickRecognize$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => currentProcessedData$.pipe(take(1))),
        filter((data) => data.length > 0),
        switchMap((processedDattaUrl) => this.recognizeOCR(processedDattaUrl))
      )
      .subscribe((res) => this.parseFromOCR(res));
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
    });

    this._currentImageDataUrl$.next(image.dataUrl!);
  }

  private preprocessImage(
    image: HTMLImageElement,
    blur: number = 0.5,
    size: number = 10,
    compensation: number = 10
  ): string {
    const imageData = this.getPixelsFromImage(image);

    // Gaussian Blur
    blurARGB(imageData.data, image.width, image.height, blur);

    // adaptive Threshhold filter  / Binarization
    // const tempSize = Math.round(image.width / 100);
    // const size = tempSize > 10 ? tempSize : 10;
    adaptiveThreshold(
      imageData.data,
      image.width,
      image.height,
      size,
      compensation
    );

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
    console.log('Date:', date);
    console.log('Total Sum:', totalSum);
  }

  private async recognizeOCR(image: ImageLike): Promise<RecognizeResult> {
    // const ret = await this.workerOCR.recognize(image);
    const res: RecognizeResult = await this.workerOCR.recognize(image);
    console.log(res);

    return res;
  }

  protected handleSizeChange(event: Event) {
    this._thresholdSizeValue$.next(
      (event as RangeCustomEvent).detail.value as number
    );
  }

  protected handleCompensationChange(event: Event) {
    this._thresholdCompensationValue$.next(
      (event as RangeCustomEvent).detail.value as number
    );
  }

  protected handleBlurChange(event: Event) {
    this._gaussianBlurValue$.next(
      (event as RangeCustomEvent).detail.value as number
    );
  }

  protected handleRecognizeButton() {
    this.clickRecognize$.next();
  }

  ngOnDestroy(): void {
    this.workerOCR.terminate();

    this.destroy$.next();
    this.destroy$.complete();
    this.clickRecognize$.complete();
  }
}
