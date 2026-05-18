import MeasureType from '@domain/enums/MeasureType';

interface StoredImage {
  filename: string;
  url: string;
}

interface ImageStorage {
  /** Persiste a imagem e retorna o filename e a URL de acesso */
  store(imageBuffer: Buffer, measureType: MeasureType): StoredImage;
}

export { StoredImage };
export default ImageStorage;
