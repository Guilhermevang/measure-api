class MeasureConfirmationRequest {
    constructor(
        public measure_uuid: string,
        public confirmed_value: number
    ) {}
}

export default MeasureConfirmationRequest;