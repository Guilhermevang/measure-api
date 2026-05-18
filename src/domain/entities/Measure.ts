import MeasureType from '@domain/enums/MeasureType';

interface MeasureData {
  uuid: string;
  customerCode: string;
  type: MeasureType;
  value: number;
  confirmed: boolean;
  imageUrl: string;
  measuredAt: Date;
  createdAt: Date;
}

class Measure {
  readonly uuid: string;
  readonly customerCode: string;
  readonly type: MeasureType;
  readonly value: number;
  readonly confirmed: boolean;
  readonly imageUrl: string;
  readonly measuredAt: Date;
  readonly createdAt: Date;

  constructor(data: MeasureData) {
    this.uuid = data.uuid;
    this.customerCode = data.customerCode;
    this.type = data.type;
    this.value = data.value;
    this.confirmed = data.confirmed;
    this.imageUrl = data.imageUrl;
    this.measuredAt = data.measuredAt;
    this.createdAt = data.createdAt;
  }

  withConfirmedValue(newValue: number): Measure {
    return new Measure({ ...this, value: newValue, confirmed: true });
  }
}

export { MeasureData };
export default Measure;
