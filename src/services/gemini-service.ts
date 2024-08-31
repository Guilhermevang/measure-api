import { GenerativeModel, GoogleGenerativeAI, FunctionDeclarationSchemaProperty, SchemaType, GenerateContentResult } from "@google/generative-ai";
import { FileMetadataResponse, GoogleAIFileManager, UploadFileResponse } from "@google/generative-ai/server";
import dotenv from "dotenv";
import { injectable } from "inversify";
import Utils from "./../utils/utils";
import ResponseFromGeneration from "./../entities/res-from-generation";
import { v4 as uuidv4 } from "uuid";
import ResponseFromUpload from "./../entities/res-from-upload";

dotenv.config({ override: true });

export interface IGeminiService {
    uploadFile(base64_image: string): Promise<ResponseFromUpload>;
    fetchFile(file_name: string): Promise<FileMetadataResponse>;
    generateContent(mime_type: string, file_uri: string): Promise<ResponseFromGeneration>;
}

@injectable()
export class GeminiService implements IGeminiService {
    apiKey: string;
    genAI: GoogleGenerativeAI;
    fileManager: GoogleAIFileManager;
    model: GenerativeModel;
    utils: Utils;
    
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.fileManager = new GoogleAIFileManager(this.apiKey);
        this.utils = new Utils();

        this.model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        measure_value: {
                            type: SchemaType.STRING,
                            example: "00000221",
                            description: "Valor contido no relógio de água ou gás"
                        },
                        black_measure: {
                            type: SchemaType.STRING,
                            example: "12345",
                            description: "Primeiros números, na cor preta (seja o fundo ou o número em si). Representam o consumo em metros cúbicos."
                        },
                        red_measure: {
                            type: SchemaType.STRING,
                            example: "678",
                            description: "Últimos 3 (três) números, na cor vermelha (seja o fundo ou o número em si)."
                        },
                    },
                },
            }
        });
    }

    async uploadFile(base64_image: string): Promise<ResponseFromUpload> {
        const uuidFileName: string = uuidv4();
        const imageBuffer: Buffer = this.utils.generateBufferFromImage(base64_image);
        const filePath: string = this.utils.writeTempFile(`${uuidFileName}-water-gas-measure.jpg`, "./content", imageBuffer);
        
        const uploadResponse: UploadFileResponse = await this.fileManager.uploadFile(
            filePath,
            {
                mimeType: "image/jpeg",
                displayName: "Medidor de Água ou Gás",
            }
        );

        console.log(`Arquivo '${uploadResponse.file.displayName}' enviado com sucesso. URI: ${uploadResponse.file.uri}`);

        return {
            fileResponse: uploadResponse,
            fileName: uuidFileName
        }
    }

    async fetchFile(file_name: string): Promise<FileMetadataResponse> {
        const fetchFileResponse: FileMetadataResponse = await this.fileManager.getFile(file_name);

        console.log(`Arquivo '${fetchFileResponse.displayName}' obtido com sucesso. URI: ${fetchFileResponse.uri}`);

        return fetchFileResponse;
    }

    async generateContent(mime_type: string, file_uri: string): Promise<ResponseFromGeneration> {
        const result = await this.model.generateContent([
            {
                fileData: {
                    mimeType: mime_type,
                    fileUri: file_uri
                }
            },
            {
                text: "Informe o valor presente no medidor de água e/ou gás. O número precisa ser inteiro e não flutuante. Tenha certeza que todos os números, até os zeros iniciais (caso existam) estejam presente. O valor da medição está presente no visor, são 8 (oito) números, sendo 5 (cinco) deles em preto e 3 (três) em vermelho. Os números pretos registram o consumo em metros cúbicos (m3), sendo que 1m3 equivale a 1.000 litros de água. E os números vermelhos registram o consumo a cada 100 e 10 litros de água."
            }
        ]);

        const resultInText: string = result.response.text();
        console.log(`Resultado: ${resultInText}`);
        const resultInJson: object = JSON.parse(resultInText);
        
        return { response: resultInJson };
    }
}