import DomainError from '@domain/errors/DomainError';

class DuplicateMeasureError extends DomainError {
  readonly errorCode = 'DOUBLE_REPORT';

  constructor() {
    super('Já existe uma leitura para esse tipo no mês atual');
  }
}

export default DuplicateMeasureError;
