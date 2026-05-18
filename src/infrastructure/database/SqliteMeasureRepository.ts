import Database from 'better-sqlite3';
import Measure, { MeasureData } from '@domain/entities/Measure';
import MeasureType from '@domain/enums/MeasureType';
import MeasureRepository from '@domain/ports/MeasureRepository';

/** Linha raw retornada pelo SQLite — campos em snake_case */
interface MeasureRow {
  uuid: string;
  customer_code: string;
  type: string;
  value: number;
  confirmed: number; // SQLite armazena boolean como 0/1
  image_url: string;
  measured_at: string;
  created_at: string;
}

class SqliteMeasureRepository implements MeasureRepository {
  constructor(private readonly db: Database.Database) {}

  save(measure: Measure): void {
    const stmt = this.db.prepare(`
      INSERT INTO measures (uuid, customer_code, type, value, confirmed, image_url, measured_at)
      VALUES (@uuid, @customerCode, @type, @value, @confirmed, @imageUrl, @measuredAt)
    `);

    stmt.run({
      uuid: measure.uuid,
      customerCode: measure.customerCode,
      type: measure.type,
      value: measure.value,
      confirmed: measure.confirmed ? 1 : 0,
      imageUrl: measure.imageUrl,
      measuredAt: measure.measuredAt.toISOString(),
    });
  }

  findById(uuid: string): Measure | null {
    const row = this.db
      .prepare('SELECT * FROM measures WHERE uuid = ?')
      .get(uuid) as MeasureRow | undefined;

    return row ? this.toEntity(row) : null;
  }

  findByCustomerTypeAndMonth(
    customerCode: string,
    type: MeasureType,
    year: number,
    month: number,
  ): Measure | null {
    const monthStr = String(month).padStart(2, '0');
    const period = `${year}-${monthStr}`;

    const row = this.db
      .prepare(
        `SELECT * FROM measures
         WHERE customer_code = ?
           AND type = ?
           AND strftime('%Y-%m', measured_at) = ?
         LIMIT 1`,
      )
      .get(customerCode, type, period) as MeasureRow | undefined;

    return row ? this.toEntity(row) : null;
  }

  findAllByCustomer(customerCode: string, type?: MeasureType): Measure[] {
    const rows = type
      ? (this.db
          .prepare(
            `SELECT * FROM measures
             WHERE customer_code = ? AND type = ?
             ORDER BY measured_at DESC`,
          )
          .all(customerCode, type) as MeasureRow[])
      : (this.db
          .prepare(
            `SELECT * FROM measures
             WHERE customer_code = ?
             ORDER BY measured_at DESC`,
          )
          .all(customerCode) as MeasureRow[]);

    return rows.map((row) => this.toEntity(row));
  }

  confirm(uuid: string, newValue: number): void {
    this.db
      .prepare('UPDATE measures SET value = ?, confirmed = 1 WHERE uuid = ?')
      .run(newValue, uuid);
  }

  private toEntity(row: MeasureRow): Measure {
    const data: MeasureData = {
      uuid: row.uuid,
      customerCode: row.customer_code,
      type: row.type as MeasureType,
      value: row.value,
      confirmed: row.confirmed === 1,
      imageUrl: row.image_url,
      measuredAt: new Date(row.measured_at),
      createdAt: new Date(row.created_at),
    };
    return new Measure(data);
  }
}

export default SqliteMeasureRepository;
