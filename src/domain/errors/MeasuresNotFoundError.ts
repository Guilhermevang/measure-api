import DomainError from '@domain/errors/DomainError';

class MeasuresNotFoundError extends DomainError {
  readonly errorCode = 'MEASURES_NOT_FOUND';

  constructor() {
    super('Nenhuma leitura encontrada para o cliente informado');
  }
}

export default MeasuresNotFoundError;
