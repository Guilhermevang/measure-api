import { injectable } from "inversify";

import Measure from "models/measure";
import database from "./database";
import { v4 as uuidv4 } from "uuid";
import MeasureType from "./../entities/enums/measure-type";
import DatabaseException from "./../entities/exceptions/database-exception";

export interface IMeasuresRepository {
    insert(measure: Measure): Promise<string>;
    list(customer_code: string, measure_datetime: string, measure_type: MeasureType | null): Promise<Measure[]>
    get(measure_uuid: string, measure_datetime: string): Promise<Measure>;
    confirm(measure_uuid: string, measure_value: number): Promise<void>;
}

@injectable()
export class MeasuresRepository implements IMeasuresRepository {
    async insert(measure: Measure): Promise<string> {
        const id: string = uuidv4();
        const sql: string = `INSERT INTO measures (uuid, customer_code, type, value, confirmed, image_url, measured_at) VALUES (?,?,?,?,?,?,?)`;
        const params: (string | number | boolean)[] = [id, measure.customer_code, measure.type, measure.value, measure.confirmed, measure.image_url, measure.measured_at];
        
        return await new Promise((resolve: Function, reject: Function) => {
            database.run(sql, params, (err) => {
                if (err) {
                    console.error("Houve um erro ao inserir uma nova leitura. ERRO:", err.message);
                    reject(new DatabaseException("Houve um erro ao inserir as medições do usuário.", "CREATING"));
                }

                resolve(id);
            });
        })
        .then((id: string) => id)
        .catch((err: DatabaseException) => {
            throw err;
        });
    }

    async list(customer_code: string, measure_datetime: string, measure_type: MeasureType | null = null): Promise<Measure[]> {
        const sql = `
            SELECT * FROM
                measures m
            WHERE
                    m.customer_code = ?
                AND m.type = ?
                AND strftime('%Y', m.measured_at) = strftime('%Y', ?)
                AND strftime('%m', m.measured_at) = strftime('%m', ?)
        `;
        const params: (string)[] = [customer_code, measure_type, measure_datetime, measure_datetime];
        
        return await new Promise((resolve: Function, reject: Function) => {
            database.all(sql, params, (err: Error, rows: Measure[]) => {
                if (err) {
                    console.error(`Houve um erro ao listar as medições de ${measure_type} do usuário ${customer_code}`);
                    reject(new DatabaseException("Houve um erro ao listar as medições do usuário.", "READING"));
                }
    
                resolve(rows);
            });
        })
        .then((rows: Measure[]) => rows)
        .catch((err: DatabaseException) => {
            throw err;
        });
    }

    async get(measure_uuid: string, measure_datetime: string): Promise<Measure> {
        const sql = `
            SELECT * FROM
                measures m
            WHERE
                    m.uuid = ?
                AND strftime('%Y', m.measured_at) = strftime('%Y', ?)
                AND strftime('%m', m.measured_at) = strftime('%m', ?)
        `;
        const params: (string)[] = [measure_uuid, measure_datetime, measure_datetime];

        return await new Promise((resolve: Function, reject: Function) => {
            database.get(sql, params, (err: Error, row: Measure) => {
                if (err) {
                    console.error(`Houve um erro ao buscar a medição com o UUID ${measure_uuid}`);
                    reject(new DatabaseException("Houve um erro ao buscar a medição.", "READING"));
                }
    
                resolve(row);
            });
        })
        .then((row: Measure) => row)
        .catch((err: DatabaseException) => {
            throw err;
        });
    }

    async confirm(measure_uuid: string, measure_value: number): Promise<void> {
        const sql = `
            UPDATE measures
            SET
                confirmed = 1,
                value = ?
            WHERE uuid = ?
        `;

        const params: (number | string)[] = [measure_value, measure_uuid];

        await new Promise((resolve: Function, reject: Function) => {
            database.run(sql, params, (err: Error | null) => {
                if (err) {
                    console.error(`Houve um erro ao confirmar a medição com UUID ${measure_uuid}. ERRO:`, err.message);
                    reject(new DatabaseException("Houve um erro ao confirmar a medição.", "UPDATING"));
                } else {
                    resolve();
                }
            });
        })
        .then(() => {
            console.log(`Medição com UUID ${measure_uuid} confirmada com sucesso.`);
        })
        .catch((err: DatabaseException) => {
            throw err;
        });
    }
}