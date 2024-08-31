import { UploadFileResponse } from "@google/generative-ai/server";

type ResponseFromUpload = {
    fileResponse: UploadFileResponse;
    fileName: string;
}

export default ResponseFromUpload;