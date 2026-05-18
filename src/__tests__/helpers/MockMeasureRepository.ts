import Measure from '@domain/entities/Measure';
import MeasureType from '@domain/enums/MeasureType';
import MeasureRepository from '@domain/ports/MeasureRepository';

class MockMeasureRepository implements MeasureRepository {
  measures: Measure[] = [];

  save(measure: Measure): void {
    this.measures.push(measure);
  }

  findById(uuid: string): Measure | null {
    return this.measures.find((m) => m.uuid === uuid) ?? null;
  }

  findByCustomerTypeAndMonth(
    customerCode: string,
    type: MeasureType,
    year: number,
    month: number,
  ): Measure | null {
    return (
      this.measures.find((m) => {
        return (
          m.customerCode === customerCode &&
          m.type === type &&
          m.measuredAt.getFullYear() === year &&
          m.measuredAt.getMonth() + 1 === month
        );
      }) ?? null
    );
  }

  findAllByCustomer(customerCode: string, type?: MeasureType): Measure[] {
    return this.measures.filter(
      (m) => m.customerCode === customerCode && (type === undefined || m.type === type),
    );
  }

  confirm(uuid: string, newValue: number): void {
    this.measures = this.measures.map((m) =>
      m.uuid === uuid ? m.withConfirmedValue(newValue) : m,
    );
  }
}

export default MockMeasureRepository;
