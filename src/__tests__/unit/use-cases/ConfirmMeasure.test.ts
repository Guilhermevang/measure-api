import ConfirmMeasure from '@application/use-cases/ConfirmMeasure';
import AlreadyConfirmedError from '@domain/errors/AlreadyConfirmedError';
import MeasureNotFoundError from '@domain/errors/MeasureNotFoundError';
import MockMeasureRepository from '../../helpers/MockMeasureRepository';
import { makeMeasure } from '../../helpers/factories';

describe('ConfirmMeasure', () => {
  let repository: MockMeasureRepository;
  let useCase: ConfirmMeasure;

  beforeEach(() => {
    repository = new MockMeasureRepository();
    useCase = new ConfirmMeasure(repository);
  });

  describe('quando a leitura existe e não foi confirmada', () => {
    it('deve confirmar a leitura com o valor informado', () => {
      const measure = makeMeasure({ value: 100 });
      repository.measures.push(measure);

      useCase.execute({ measureUuid: measure.uuid, confirmedValue: 150 });

      const updated = repository.findById(measure.uuid);
      expect(updated?.confirmed).toBe(true);
      expect(updated?.value).toBe(150);
    });
  });

  describe('quando a leitura não existe', () => {
    it('deve lançar MeasureNotFoundError', () => {
      expect(() =>
        useCase.execute({ measureUuid: 'uuid-inexistente', confirmedValue: 100 }),
      ).toThrow(MeasureNotFoundError);
    });
  });

  describe('quando a leitura já foi confirmada', () => {
    it('deve lançar AlreadyConfirmedError', () => {
      const measure = makeMeasure({ confirmed: true });
      repository.measures.push(measure);

      expect(() =>
        useCase.execute({ measureUuid: measure.uuid, confirmedValue: 200 }),
      ).toThrow(AlreadyConfirmedError);
    });
  });
});
