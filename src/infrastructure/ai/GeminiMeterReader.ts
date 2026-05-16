import {
  GoogleGenerativeAI,
  GenerativeModel,
  SchemaType,
} from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import MeasureType from '@domain/enums/MeasureType';
import MeterReaderService from '@domain/ports/MeterReaderService';
import logger from '@shared/logger';

/** Formato esperado da resposta estruturada do Gemini */
interface GeminiMeterResponse {
  measure_value: number;
}

const METER_LABELS: Record<MeasureType, string> = {
  [MeasureType.WATER]: 'hidrômetro (medidor de água)',
  [MeasureType.GAS]: 'medidor de gás',
  [MeasureType.ELECTRICITY]: 'medidor de energia elétrica (relógio)',
};

class GeminiMeterReader implements MeterReaderService {
  private readonly model: GenerativeModel;
  private readonly fileManager: GoogleAIFileManager;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);

    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            measure_value: {
              type: SchemaType.INTEGER,
              description: 'Valor inteiro lido no visor do medidor, sem zeros à esquerda',
            },
          },
          required: ['measure_value'],
        },
      },
    });
  }

  async readMeter(imageBuffer: Buffer, measureType: MeasureType): Promise<number> {
    const tempPath = this.writeTempFile(imageBuffer);

    try {
      const uploadResponse = await this.fileManager.uploadFile(tempPath, {
        mimeType: 'image/jpeg',
        displayName: `medidor-${measureType.toLowerCase()}-${uuidv4()}`,
      });

      logger.info(
        { uri: uploadResponse.file.uri, type: measureType },
        'Imagem enviada ao Gemini com sucesso',
      );

      const result = await this.model.generateContent([
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          },
        },
        { text: this.buildPrompt(measureType) },
      ]);

      const raw = result.response.text();
      logger.info({ raw, type: measureType }, 'Resposta recebida do Gemini');

      const parsed = JSON.parse(raw) as GeminiMeterResponse;
      return parsed.measure_value;
    } finally {
      // Garante que o arquivo temporário é removido mesmo em caso de erro
      fs.unlink(tempPath, () => undefined);
    }
  }

  private writeTempFile(buffer: Buffer): string {
    const filePath = path.join(os.tmpdir(), `meter-${uuidv4()}.jpg`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  private buildPrompt(type: MeasureType): string {
    return (
      `Analise a imagem do ${METER_LABELS[type]} e extraia o valor numérico inteiro ` +
      'exibido no visor. Retorne o número inteiro sem zeros à esquerda desnecessários. ' +
      'Considere todos os dígitos visíveis no display do medidor.'
    );
  }
}

export default GeminiMeterReader;
