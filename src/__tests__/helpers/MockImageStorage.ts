import MeasureType from '@domain/enums/MeasureType';
import ImageStorage, { StoredImage } from '@domain/ports/ImageStorage';

class MockImageStorage implements ImageStorage {
  store(_imageBuffer: Buffer, measureType: MeasureType): StoredImage {
    const filename = `test-${measureType.toLowerCase()}-meter.jpg`;
    return {
      filename,
      url: `http://localhost:8800/images/${filename}`,
    };
  }
}

export default MockImageStorage;
