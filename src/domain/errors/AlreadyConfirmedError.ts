import DomainError from '@domain/errors/DomainError';

class AlreadyConfirmedError extends DomainError {
  readonly errorCode = 'CONFIRMATION_DUPLICATE';

  constructor() {
    super('Leitura já foi confirmada anteriormente');
  }
}

export default AlreadyConfirmedError;
