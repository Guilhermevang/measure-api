import { inject, injectable } from "inversify";
import { Locator } from "../../locator";

import ImageProcessing from "./../entities/requests/image-processing";
import { IMeasuresRepository } from "repositories/measures-repository";
import CustomException from "./../entities/exceptions/custom-exception";
import MeasureResultFromGemini from "./../entities/measure-result";
import { IGeminiService } from "./gemini-service";
import Measure from "./../models/measure";
import { IndividualMeasureResponse, MeasureListResponse } from "./../entities/responses/measure-list-response";
import MeasureType from "entities/enums/measure-type";

export interface IMeasuresService {
    processImage(body: ImageProcessing): Promise<any>;
    listMeasures(customer_code: string, measure_type: MeasureType | null): Promise<MeasureListResponse>;
    confirmMeasure(measure_uuid: string, value: number): Promise<void>;
}

@injectable()
export class MeasuresService implements IMeasuresService {
    PORT_NUMBER: string;
    
    constructor(
        @inject(Locator.IMeasuresRepository) private measuresRepository: IMeasuresRepository,
        @inject(Locator.IGeminiService) private geminiService: IGeminiService
    ) {
        this.PORT_NUMBER = process.env.PORT_NUMBER || String(8800);
    }

    generateTempImageUrl(file_name: string): string {
        return `http://localhost:${this.PORT_NUMBER}/content/${file_name}`;
    }

    async processImage(body: ImageProcessing): Promise<MeasureResultFromGemini> {
        body = new ImageProcessing(
            body.image,
            body.customer_code,
            body.measure_datetime,
            body.measure_type
        );
        
        // Validar o tipo de dados dos parâmetros enviados (inclusive o base64)
        body.validate();

        // Verificar se já existe uma leitura no mês naquele tipo de leitura.
        const measures = await this.measuresRepository.list(
            body.customer_code,
            body.measure_datetime,
            body.measure_type
        );

        if (measures.length > 0) {
            throw new CustomException("DOUBLE_REPORT");
        }
        
        // Integrar com uma API de LLM para extrair o valor da imagem
        // Envia a imagem
        const response = await this.geminiService.uploadFile(body.image);
        
        // Gera a resposta
        const result = await this.geminiService.generateContent(
            response.fileResponse.file.mimeType,
            response.fileResponse.file.uri
        );

        if (!("measure_value" in result.response)) {
            throw new CustomException("INTERNAL");
        }

        const tempImageUrl: string = this.generateTempImageUrl(response.fileName);

        const measure: Measure = {
            confirmed: false,
            customer_code: body.customer_code,
            image_url: tempImageUrl,
            measured_at: body.measure_datetime,
            type: body.measure_type,
            value: result.response.measure_value
        } as Measure;

        const uuidFromBD: string = await this.measuresRepository.insert(measure);

        // Retorna o JSON
        return {
            temp_url: tempImageUrl,
            measure_value: result.response.measure_value,
            bd_uuid: uuidFromBD
        } as MeasureResultFromGemini;
    }

    async listMeasures(customer_code: string, measure_type: MeasureType | null = null): Promise<MeasureListResponse> {
        const today_date: string = new Date().toJSON();
        const measures: Measure[] = await this.measuresRepository.list(customer_code, today_date, measure_type)

        if (measures.length === 0) {
            throw new CustomException("MEASURES_NOT_FOUND");
        }

        const mapDtoMeasures: IndividualMeasureResponse[] = measures.map((measure: Measure) => {
            return new IndividualMeasureResponse(
                measure.uuid,
                measure.measured_at,
                measure.type,
                measure.confirmed,
                measure.image_url
            )
        });

        return new MeasureListResponse(
            customer_code,
            mapDtoMeasures
        );
    }

    async confirmMeasure(measure_uuid: string, value: number): Promise<void> {
        if (
            (measure_uuid === null || measure_uuid.length === 0) ||
            (value === null || value.toString().length === 0 || value < 0)
        ) {
            throw new CustomException("INVALID_DATA");
        }

        const today_date: string = new Date().toJSON();
        const measure: Measure = await this.measuresRepository.get(measure_uuid, today_date);
        
        if (measure === null || measure.uuid.length === 0) {
            throw new CustomException("MEASURE_NOT_FOUND");
        }

        if (measure.confirmed) {
            throw new CustomException("CONFIRMATION_DUPLICATE");
        }

        await this.measuresRepository.confirm(measure_uuid, value);
    }
}