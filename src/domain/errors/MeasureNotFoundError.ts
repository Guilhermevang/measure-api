import DomainError from '@domain/errors/DomainError';

class MeasureNotFoundError extends DomainError {
  readonly errorCode = 'MEASURE_NOT_FOUND';

  constructor() {
    super('Leitura não encontrada');
  }
}

export default MeasureNotFoundError;
