import Database from 'better-sqlite3';
import MeasureRepository from '@domain/ports/MeasureRepository';
import MeterReaderService from '@domain/ports/MeterReaderService';
import ImageStorage from '@domain/ports/ImageStorage';
import { createDatabase } from '@infrastructure/database/db';
import SqliteMeasureRepository from '@infrastructure/database/SqliteMeasureRepository';
import GeminiMeterReader from '@infrastructure/ai/GeminiMeterReader';
import LocalImageStorage from '@infrastructure/storage/LocalImageStorage';

interface AppContainer {
  db: Database.Database;
  measureRepository: MeasureRepository;
  meterReaderService: MeterReaderService;
  imageStorage: ImageStorage;
}

function createContainer(dbPath?: string): AppContainer {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('A variável de ambiente GEMINI_API_KEY não está configurada');
  }

  const baseUrl = process.env.APP_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8800}`;

  const db = createDatabase(dbPath);

  return {
    db,
    measureRepository: new SqliteMeasureRepository(db),
    meterReaderService: new GeminiMeterReader(geminiKey),
    imageStorage: new LocalImageStorage('./storage', baseUrl),
  };
}

export { AppContainer };
export default createContainer;
