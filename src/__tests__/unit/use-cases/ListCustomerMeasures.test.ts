import ListCustomerMeasures from '@application/use-cases/ListCustomerMeasures';
import MeasureType from '@domain/enums/MeasureType';
import MeasuresNotFoundError from '@domain/errors/MeasuresNotFoundError';
import MockMeasureRepository from '../../helpers/MockMeasureRepository';
import { makeMeasure } from '../../helpers/factories';

describe('ListCustomerMeasures', () => {
  let repository: MockMeasureRepository;
  let useCase: ListCustomerMeasures;

  beforeEach(() => {
    repository = new MockMeasureRepository();
    useCase = new ListCustomerMeasures(repository);
  });

  describe('quando o cliente possui leituras', () => {
    it('deve retornar todas as leituras do cliente', () => {
      repository.measures.push(
        makeMeasure({ customerCode: 'cliente-001', type: MeasureType.WATER }),
        makeMeasure({ customerCode: 'cliente-001', type: MeasureType.GAS }),
        makeMeasure({ customerCode: 'cliente-002', type: MeasureType.WATER }),
      );

      const result = useCase.execute({ customerCode: 'cliente-001' });

      expect(result.customerCode).toBe('cliente-001');
      expect(result.measures).toHaveLength(2);
    });

    it('deve filtrar por tipo quando informado', () => {
      repository.measures.push(
        makeMeasure({ customerCode: 'cliente-001', type: MeasureType.WATER }),
        makeMeasure({ customerCode: 'cliente-001', type: MeasureType.GAS }),
        makeMeasure({ customerCode: 'cliente-001', type: MeasureType.ELECTRICITY }),
      );

      const result = useCase.execute({ customerCode: 'cliente-001', measureType: MeasureType.GAS });

      expect(result.measures).toHaveLength(1);
      expect(result.measures[0].measureType).toBe(MeasureType.GAS);
    });

    it('deve mapear os campos corretamente', () => {
      const measure = makeMeasure({
        customerCode: 'cliente-001',
        confirmed: true,
      });
      repository.measures.push(measure);

      const result = useCase.execute({ customerCode: 'cliente-001' });
      const item = result.measures[0];

      expect(item.measureUuid).toBe(measure.uuid);
      expect(item.hasConfirmed).toBe(true);
      expect(item.imageUrl).toBe(measure.imageUrl);
    });
  });

  describe('quando o cliente não possui leituras', () => {
    it('deve lançar MeasuresNotFoundError', () => {
      expect(() => useCase.execute({ customerCode: 'cliente-sem-leituras' })).toThrow(
        MeasuresNotFoundError,
      );
    });
  });
});
