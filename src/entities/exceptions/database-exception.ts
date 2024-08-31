import DatabaseOperationException from "./../../entities/enums/db-operation-exception";

class DatabaseException {
    constructor(
        public message: string = "Houve um erro ao executar o processamento no banco de dados.",
        public operation: DatabaseOperationException
    ) {}
}

export default DatabaseException;