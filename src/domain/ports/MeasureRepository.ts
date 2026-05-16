import Measure from '@domain/entities/Measure';
import MeasureType from '@domain/enums/MeasureType';

interface MeasureRepository {
  save(measure: Measure): void;
  findById(uuid: string): Measure | null;
  /** Busca uma leitura do cliente para o tipo e mês/ano especificado */
  findByCustomerTypeAndMonth(
    customerCode: string,
    type: MeasureType,
    year: number,
    month: number,
  ): Measure | null;
  /** Lista todas as leituras de um cliente, com filtro opcional por tipo */
  findAllByCustomer(customerCode: string, type?: MeasureType): Measure[];
  /** Atualiza o valor e marca a leitura como confirmada */
  confirm(uuid: string, newValue: number): void;
}

export default MeasureRepository;
