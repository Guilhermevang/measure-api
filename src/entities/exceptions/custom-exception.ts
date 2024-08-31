import ErrorCode from "./../enums/error-code";

class CustomException {
    private _status_code: number = 500;

    public get status_code(): number {
        return this._status_code;
    }

    private set status_code(status: number) {
        this._status_code = status;
    }

    constructor(
        public error_code: ErrorCode,
        public error_description: string | null = null,
    ) {
        if (error_description === null) {
            this.describeError();
        }

        this.setStatusCode();
    }

    describeError(): void {
        switch (this.error_code) {
            case "INTERNAL":
                this.error_description = "Houve um erro interno."
            case "INVALID_DATA":
                this.error_description = "Os dados fornecidos no corpo da requisição são inválidos.";
                break;
            case "DOUBLE_REPORT":
                this.error_description = "Já existe uma leitura para este tipo no mês atual.";
                break;
            case "INVALID_TYPE":
                this.error_description = "Tipo de medição não permitida";
                break;
            case "MEASURES_NOT_FOUND":
                this.error_description = "Nenhuma leitura encontrada";
                break;
            case "MEASURE_NOT_FOUND":
                this.error_description = "Leitura não encontrada";
                break;
            case "CONFIRMATION_DUPLICATE":
                this.error_description = "Leitura do mês já realizada";
                break;
            default:
                this.error_description = "Houve um erro não tratado.";
                break;
        }
    }

    setStatusCode():void {
        switch (this.error_code) {
            case "INTERNAL":
                this.status_code = 500;
                break;
            case "INVALID_DATA":
                this.status_code = 400;
                break;
            case "DOUBLE_REPORT":
                this.status_code = 409;
                break;
            case "INVALID_TYPE":
                this.status_code = 400;
                break;
            case "MEASURES_NOT_FOUND":
                this.status_code = 400;
                break;
            case "MEASURE_NOT_FOUND":
                this.status_code = 400;
                break;
            case "CONFIRMATION_DUPLICATE":
                this.status_code = 409;
                break;
            default:
                this.status_code = 500;
                break;
        }
    }

    toJson(): object {
        return {
            error_code: this.error_code,
            error_description: this.error_description,
        }
    }
}

export default CustomException;