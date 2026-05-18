import MeasureType from '@domain/enums/MeasureType';
import MeasuresNotFoundError from '@domain/errors/MeasuresNotFoundError';
import MeasureRepository from '@domain/ports/MeasureRepository';

interface ListCustomerMeasuresInput {
  customerCode: string;
  measureType?: MeasureType;
}

interface MeasureItem {
  measureUuid: string;
  measureDatetime: Date;
  measureType: MeasureType;
  hasConfirmed: boolean;
  imageUrl: string;
}

interface ListCustomerMeasuresOutput {
  customerCode: string;
  measures: MeasureItem[];
}

class ListCustomerMeasures {
  constructor(private readonly measureRepository: MeasureRepository) {}

  execute(input: ListCustomerMeasuresInput): ListCustomerMeasuresOutput {
    const measures = this.measureRepository.findAllByCustomer(
      input.customerCode,
      input.measureType,
    );

    if (measures.length === 0) {
      throw new MeasuresNotFoundError();
    }

    return {
      customerCode: input.customerCode,
      measures: measures.map((m) => ({
        measureUuid: m.uuid,
        measureDatetime: m.measuredAt,
        measureType: m.type,
        hasConfirmed: m.confirmed,
        imageUrl: m.imageUrl,
      })),
    };
  }
}

export { ListCustomerMeasuresInput, ListCustomerMeasuresOutput, MeasureItem };
export default ListCustomerMeasures;
