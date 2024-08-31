import MeasureType from "entities/enums/measure-type";

export class IndividualMeasureResponse {
    constructor(
        public measure_uuid: string,
        public measure_datetime: string,
        public measure_type: MeasureType,
        public has_confirmed: boolean,
        public image_url: string
    ) {}
}

export class MeasureListResponse {
    constructor(
        public customer_code: string,
        public measures: IndividualMeasureResponse[]
    ) {}
}