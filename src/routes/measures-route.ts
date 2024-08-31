import { container } from "../../container";

import express from "express";
import ImageProcessing from "../entities/requests/image-processing";
import { MeasuresService } from "./../services/measures-service"
import ControllerBase from "./../services/controller-base";
import MeasureResultFromGemini from "./../entities/measure-result";
import MeasureResponse from "./../entities/responses/measure-response";
import { MeasureListResponse } from "./../entities/responses/measure-list-response";
import MeasureType from "./../entities/enums/measure-type";
import MeasureConfirmationRequest from "./../entities/requests/measure-confirmation-request";
import MeasureConfirmationResponse from "./../entities/responses/measure-confirmation-response";

const route = express.Router();

const measuresService = container.get<MeasuresService>(MeasuresService);
const controllerBase = new ControllerBase();

route.post("/upload", async (req: express.Request, res: express.Response) => {
    return await controllerBase.execute(res, async () => {
        const body: ImageProcessing = req.body;
        const result: MeasureResultFromGemini = await measuresService.processImage(body);
        return new MeasureResponse(
            result.temp_url,
            Number(result.measure_value),
            result.bd_uuid
        );
    });
});

route.patch("/confirm", async (req: express.Request, res: express.Response) => {
    return await controllerBase.execute(res, async () => {
        const body: MeasureConfirmationRequest = req.body;
        await measuresService.confirmMeasure(body.measure_uuid, body.confirmed_value);
        return new MeasureConfirmationResponse(true);
    });
});

route.get("/:customer_code/list", async (req: express.Request, res: express.Response) => {
    return await controllerBase.execute(res, async () => {
        const customer_code: string = req.params.customer_code;
        const query_measure_type: string = req.query.measure_type as string;
        const measure_type: MeasureType = query_measure_type.toUpperCase() as unknown as MeasureType;
        const result: MeasureListResponse = await measuresService.listMeasures(customer_code, measure_type);
        return result;
    });
});

export default route;