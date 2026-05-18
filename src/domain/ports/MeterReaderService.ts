import MeasureType from '@domain/enums/MeasureType';

interface MeterReaderService {
  /** Processa a imagem e extrai o valor numérico do medidor */
  readMeter(imageBuffer: Buffer, measureType: MeasureType): Promise<number>;
}

export default MeterReaderService;
