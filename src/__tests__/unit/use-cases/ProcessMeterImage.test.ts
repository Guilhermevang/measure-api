import ProcessMeterImage from '@application/use-cases/ProcessMeterImage';
import MeasureType from '@domain/enums/MeasureType';
import DuplicateMeasureError from '@domain/errors/DuplicateMeasureError';
import MockMeasureRepository from '../../helpers/MockMeasureRepository';
import MockMeterReader from '../../helpers/MockMeterReader';
import MockImageStorage from '../../helpers/MockImageStorage';
import { makeMeasure } from '../../helpers/factories';

describe('ProcessMeterImage', () => {
  let repository: MockMeasureRepository;
  let meterReader: MockMeterReader;
  let imageStorage: MockImageStorage;
  let useCase: ProcessMeterImage;

  const validInput = {
    image: Buffer.from('fake-image').toString('base64'),
    customerCode: 'cliente-001',
    measureDatetime: new Date('2024-08-15T10:00:00Z'),
    measureType: MeasureType.WATER,
  };

  beforeEach(() => {
    repository = new MockMeasureRepository();
    meterReader = new MockMeterReader(12345);
    imageStorage = new MockImageStorage();
    useCase = new ProcessMeterImage(repository, meterReader, imageStorage);
  });

  describe('quando os dados são válidos', () => {
    it('deve processar a imagem e salvar a leitura', async () => {
      const result = await useCase.execute(validInput);

      expect(result.measureValue).toBe(12345);
      expect(result.imageUrl).toContain('/images/');
      expect(result.measureUuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(repository.measures).toHaveLength(1);
    });

    it('deve salvar a leitura como não-confirmada', async () => {
      await useCase.execute(validInput);
      expect(repository.measures[0].confirmed).toBe(false);
    });

    it('deve aceitar imagem base64 com prefixo data URL', async () => {
      const inputWithPrefix = {
        ...validInput,
        image: `data:image/jpeg;base64,${Buffer.from('fake-image').toString('base64')}`,
      };

      const result = await useCase.execute(inputWithPrefix);
      expect(result.measureValue).toBe(12345);
    });
  });

  describe('quando já existe uma leitura no mesmo mês', () => {
    it('deve lançar DuplicateMeasureError', async () => {
      const existingMeasure = makeMeasure({
        customerCode: 'cliente-001',
        type: MeasureType.WATER,
        measuredAt: new Date('2024-08-01T08:00:00Z'),
      });
      repository.measures.push(existingMeasure);

      await expect(useCase.execute(validInput)).rejects.toThrow(DuplicateMeasureError);
    });

    it('deve permitir leitura de tipo diferente no mesmo mês', async () => {
      const existingMeasure = makeMeasure({
        customerCode: 'cliente-001',
        type: MeasureType.GAS, // tipo diferente
        measuredAt: new Date('2024-08-01T08:00:00Z'),
      });
      repository.measures.push(existingMeasure);

      const result = await useCase.execute(validInput);
      expect(result.measureValue).toBe(12345);
    });

    it('deve permitir leitura do mesmo tipo em mês diferente', async () => {
      const existingMeasure = makeMeasure({
        customerCode: 'cliente-001',
        type: MeasureType.WATER,
        measuredAt: new Date('2024-07-01T08:00:00Z'), // mês anterior
      });
      repository.measures.push(existingMeasure);

      const result = await useCase.execute(validInput);
      expect(result.measureValue).toBe(12345);
    });
  });
});
