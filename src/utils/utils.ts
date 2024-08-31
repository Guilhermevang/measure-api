import CustomException from './../entities/exceptions/custom-exception';
import { writeFileSync, unlinkSync, write } from 'fs';
import { join } from 'path';

class Utils {
    constructor() {}

    generateBufferFromImage(base64_image: string): Buffer {
        if (base64_image === null || base64_image.length === 0) {
            throw new CustomException('INVALID_DATA');
        }
        
        const base64Data = base64_image.replace(/^data:image\/\w+;base64,/, "");
        const buffer: Buffer = Buffer.from(base64Data, "base64");
        return buffer;
    }
    
    writeTempFile(file_name: string, path: string, buffer: Buffer): string {
        const tempFilePath: string = join(path, file_name);
        writeFileSync(tempFilePath, buffer);
        return tempFilePath;
    }
}

export default Utils;