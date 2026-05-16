import MeasureType from '@domain/enums/MeasureType';
import MeterReaderService from '@domain/ports/MeterReaderService';

class MockMeterReader implements MeterReaderService {
  returnValue: number;

  constructor(returnValue = 99999) {
    this.returnValue = returnValue;
  }

  async readMeter(_imageBuffer: Buffer, _measureType: MeasureType): Promise<number> {
    return this.returnValue;
  }
}

export default MockMeterReader;
