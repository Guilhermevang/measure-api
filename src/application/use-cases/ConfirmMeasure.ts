import AlreadyConfirmedError from '@domain/errors/AlreadyConfirmedError';
import MeasureNotFoundError from '@domain/errors/MeasureNotFoundError';
import MeasureRepository from '@domain/ports/MeasureRepository';

interface ConfirmMeasureInput {
  measureUuid: string;
  confirmedValue: number;
}

class ConfirmMeasure {
  constructor(private readonly measureRepository: MeasureRepository) {}

  execute(input: ConfirmMeasureInput): void {
    const measure = this.measureRepository.findById(input.measureUuid);

    if (!measure) {
      throw new MeasureNotFoundError();
    }

    if (measure.confirmed) {
      throw new AlreadyConfirmedError();
    }

    this.measureRepository.confirm(measure.uuid, input.confirmedValue);
  }
}

export { ConfirmMeasureInput };
export default ConfirmMeasure;
