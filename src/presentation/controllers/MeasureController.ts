import { Request, Response, NextFunction } from 'express';
import ProcessMeterImage from '@application/use-cases/ProcessMeterImage';
import ConfirmMeasure from '@application/use-cases/ConfirmMeasure';
import ListCustomerMeasures from '@application/use-cases/ListCustomerMeasures';
import { UploadBody, ConfirmBody, ListParams, ListQuery } from '@presentation/schemas/measureSchemas';
import MeasureType from '@domain/enums/MeasureType';

class MeasureController {
  constructor(
    private readonly processImage: ProcessMeterImage,
    private readonly confirmMeasure: ConfirmMeasure,
    private readonly listMeasures: ListCustomerMeasures,
  ) {}

  upload = async (
    req: Request<object, object, UploadBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { image, customer_code, measure_datetime, measure_type } = req.body;

      const result = await this.processImage.execute({
        image,
        customerCode: customer_code,
        measureDatetime: new Date(measure_datetime),
        measureType: measure_type,
      });

      res.status(200).json({
        image_url: result.imageUrl,
        measure_value: result.measureValue,
        measure_uuid: result.measureUuid,
      });
    } catch (err) {
      next(err);
    }
  };

  confirm = (
    req: Request<object, object, ConfirmBody>,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      this.confirmMeasure.execute({
        measureUuid: req.body.measure_uuid,
        confirmedValue: req.body.confirmed_value,
      });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  };

  list = (
    req: Request<ListParams, object, object, ListQuery>,
    res: Response,
    next: NextFunction,
  ): void => {
    try {
      const result = this.listMeasures.execute({
        customerCode: req.params.customer_code,
        measureType: req.query.measure_type as MeasureType | undefined,
      });

      res.status(200).json({
        customer_code: result.customerCode,
        measures: result.measures.map((m) => ({
          measure_uuid: m.measureUuid,
          measure_datetime: m.measureDatetime.toISOString(),
          measure_type: m.measureType,
          has_confirmed: m.hasConfirmed,
          image_url: m.imageUrl,
        })),
      });
    } catch (err) {
      next(err);
    }
  };
}

export default MeasureController;
