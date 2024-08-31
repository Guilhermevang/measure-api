import CustomException from "./../../entities/exceptions/custom-exception";
import MeasureType from "../enums/measure-type";

// type ImageProcessing = {
//     image: string, // base64
//     customer_code: string,
//     measure_datetime: Date,
//     measure_type: MeasureType, // "WATER" ou "GAS"
// }

class ImageProcessing {
    constructor(
        public image: string, // base64
        public customer_code: string,
        public measure_datetime: string, // talvez ISO 8601 (?)
        public measure_type: MeasureType, // "WATER" ou "GAS"
    ) {}

    public validate(): void {
        const errors: string[] = [];
        
        if (!this.imageInBase64()) {
            errors.push("A imagem deve estar em Base64.");
        }

        if (!this.customerCodeIsString()) {
            errors.push("O código do usuário deve estar no formato de 'string'.");
        }

        if (!this.datetimeInValidFormat()) {
            errors.push("A data deve estar em um formato válido (ISO 8601).");
        }

        if (errors.length > 0) {
            throw new CustomException("INVALID_DATA");
        }
    }

    private imageInBase64(): boolean {
        // Utilizei GPT para criar esse REGEX cabuloso e confirmei em fóruns
        const regex = /^(data:image\/[a-zA-Z]+;base64,)?[A-Za-z0-9+/]+={0,2}$/;
        return regex.test(this.image);
    }

    private customerCodeIsString(): boolean {
        return typeof this.customer_code === "string";
    }

    private datetimeInValidFormat(): boolean {
        return !isNaN(this.parseMeasureDatetime().getTime());
    }

    public parseMeasureDatetime(): Date {
        return new Date(this.measure_datetime);
    }
}

export default ImageProcessing;