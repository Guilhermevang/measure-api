import MeasureType from "./../entities/enums/measure-type";

type Measure = {
    uuid?: string,
    customer_code: string,
    type: MeasureType,
    value: number,
    confirmed: boolean,
    image_url: string,
    measured_at: string,
    created_at?: Date,
}

export default Measure;