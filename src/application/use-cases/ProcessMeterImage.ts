import { v4 as uuidv4 } from 'uuid';
import Measure, { MeasureData } from '@domain/entities/Measure';
import MeasureType from '@domain/enums/MeasureType';
import DuplicateMeasureError from '@domain/errors/DuplicateMeasureError';
import MeasureRepository from '@domain/ports/MeasureRepository';
import MeterReaderService from '@domain/ports/MeterReaderService';
import ImageStorage from '@domain/ports/ImageStorage';

interface ProcessMeterImageInput {
  /** Imagem do medidor em base64 (com ou sem prefixo data URL) */
  image: string;
  customerCode: string;
  measureDatetime: Date;
  measureType: MeasureType;
}

interface ProcessMeterImageOutput {
  imageUrl: string;
  measureValue: number;
  measureUuid: string;
}

class ProcessMeterImage {
  constructor(
    private readonly measureRepository: MeasureRepository,
    private readonly meterReaderService: MeterReaderService,
    private readonly imageStorage: ImageStorage,
  ) {}

  async execute(input: ProcessMeterImageInput): Promise<ProcessMeterImageOutput> {
    const { measureDatetime, customerCode, measureType } = input;

    // Verifica duplicidade antes de qualquer operação custosa
    const existing = this.measureRepository.findByCustomerTypeAndMonth(
      customerCode,
      measureType,
      measureDatetime.getFullYear(),
      measureDatetime.getMonth() + 1,
    );

    if (existing) {
      throw new DuplicateMeasureError();
    }

    const imageBuffer = this.decodeBase64(input.image);

    // Persiste a imagem localmente
    const { url: imageUrl } = this.imageStorage.store(imageBuffer, measureType);

    // Envia ao Gemini para leitura do valor
    const measureValue = await this.meterReaderService.readMeter(imageBuffer, measureType);

    const measure = new Measure({
      uuid: uuidv4(),
      customerCode,
      type: measureType,
      value: measureValue,
      confirmed: false,
      imageUrl,
      measuredAt: measureDatetime,
      createdAt: new Date(),
    } satisfies MeasureData);

    this.measureRepository.save(measure);

    return {
      imageUrl,
      measureValue,
      measureUuid: measure.uuid,
    };
  }

  private decodeBase64(image: string): Buffer {
    // Remove o prefixo data URL caso esteja presente (ex: "data:image/jpeg;base64,...")
    const raw = image.replace(/^data:[^;]+;base64,/, '');
    return Buffer.from(raw, 'base64');
  }
}

export { ProcessMeterImageInput, ProcessMeterImageOutput };
export default ProcessMeterImage;
