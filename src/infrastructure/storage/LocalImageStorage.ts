import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import MeasureType from '@domain/enums/MeasureType';
import ImageStorage, { StoredImage } from '@domain/ports/ImageStorage';

class LocalImageStorage implements ImageStorage {
  private readonly storageDir: string;
  private readonly baseUrl: string;

  constructor(storageDir: string, baseUrl: string) {
    this.storageDir = path.resolve(storageDir);
    this.baseUrl = baseUrl;
    this.ensureStorageDirExists();
  }

  store(imageBuffer: Buffer, measureType: MeasureType): StoredImage {
    const filename = this.generateFilename(measureType);
    const fullPath = path.join(this.storageDir, filename);

    fs.writeFileSync(fullPath, imageBuffer);

    return {
      filename,
      url: `${this.baseUrl}/images/${filename}`,
    };
  }

  private generateFilename(type: MeasureType): string {
    return `${uuidv4()}-${type.toLowerCase()}-meter.jpg`;
  }

  private ensureStorageDirExists(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }
}

export default LocalImageStorage;
