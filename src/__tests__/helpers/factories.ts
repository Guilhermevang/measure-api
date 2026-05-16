import { v4 as uuidv4 } from 'uuid';
import Measure, { MeasureData } from '@domain/entities/Measure';
import MeasureType from '@domain/enums/MeasureType';

function makeMeasure(overrides: Partial<MeasureData> = {}): Measure {
  return new Measure({
    uuid: uuidv4(),
    customerCode: 'cliente-teste',
    type: MeasureType.WATER,
    value: 12345,
    confirmed: false,
    imageUrl: 'http://localhost:8800/images/test.jpg',
    measuredAt: new Date('2024-08-15T10:00:00Z'),
    createdAt: new Date('2024-08-15T10:00:01Z'),
    ...overrides,
  });
}

export { makeMeasure };
