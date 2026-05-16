import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { AppContainer } from '@shared/container';
import ProcessMeterImage from '@application/use-cases/ProcessMeterImage';
import ConfirmMeasure from '@application/use-cases/ConfirmMeasure';
import ListCustomerMeasures from '@application/use-cases/ListCustomerMeasures';
import MeasureController from '@presentation/controllers/MeasureController';
import measureRoutes from '@presentation/routes/measureRoutes';
import apiKeyAuth from '@presentation/middlewares/apiKeyAuth';
import errorHandler from '@presentation/middlewares/errorHandler';
import setupSwagger from '@presentation/swagger/setup';

function createApp(container: AppContainer): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Serve as imagens armazenadas localmente
  app.use('/images', express.static(path.resolve('./storage')));

  setupSwagger(app);

  const controller = new MeasureController(
    new ProcessMeterImage(
      container.measureRepository,
      container.meterReaderService,
      container.imageStorage,
    ),
    new ConfirmMeasure(container.measureRepository),
    new ListCustomerMeasures(container.measureRepository),
  );

  app.use('/api', apiKeyAuth, measureRoutes(controller));

  // Deve ser registrado após as rotas
  app.use(errorHandler);

  return app;
}

export default createApp;
