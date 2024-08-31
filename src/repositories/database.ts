import sqlite3 from "sqlite3";

const DBSOURCE = "sb.sqlite";

const SQLTables: string[] = [
    `
    CREATE TABLE IF NOT EXISTS measures (
        uuid VARCHAR(36) PRIMARY KEY NOT NULL,
        customer_code VARCHAR(45) NOT NULL,
        type VARCHAR(45) NOT NULL,
        value INT NOT NULL,
        confirmed TINYINT NOT NULL DEFAULT 0,
        image_url TEXT NOT NULL,
        measured_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `
];

const database = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error("Houve um erro ao conectar o banco de dados:", err.message);
        throw err;
    } else {
        console.log("Sucesso na conexão com o banco de dados.");

        database.serialize(() => {
            for (const table of SQLTables) {
                database.run(table, (err) => {
                    if (err) {
                        console.error("Houve um erro a criar a tabela. ERRO:", err.message);
                    } else {
                        console.log("Tabela criada com sucesso.");
                    }
                });
            }
        });
    }
});

export default database;