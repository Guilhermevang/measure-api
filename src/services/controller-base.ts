import CustomException from "./../entities/exceptions/custom-exception";
import express from "express";

interface AutoResponseFunction {
    (): Promise<any | unknown>;
}

class ControllerBase {
    constructor() {}

    public async execute(res: express.Response, func: AutoResponseFunction): Promise<any | unknown> {
        try {
            const response = await func();
            res.status(200).send(this.autoResponse(response));
        } catch(exception: any) {
            let error: CustomException;
            
            if (exception instanceof CustomException) {
                error = this.exceptionResponse(exception as CustomException);
            } else {
                error = this.exceptionResponse(new CustomException("INTERNAL"));
            }
            
            res.status(error.status_code).send(error.toJson());
        }
    }

    public autoResponse(obj: any | unknown) {
        if (obj instanceof CustomException) {
            return this.exceptionResponse(obj as CustomException);
        } else {
            return this.baseResponse(obj);
        }
    }

    private exceptionResponse(exception: CustomException): CustomException {
        console.error("Houve um erro. ERRO:", exception.error_description);
        return exception;
    }

    private baseResponse(response: any | unknown) {
        console.log("Sucesso!");
        return response;
    }
}

export default ControllerBase;