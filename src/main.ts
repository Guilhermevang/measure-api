import 'dotenv/config';
import createApp from './app';
import createContainer from '@shared/container';
import logger from '@shared/logger';

const PORT = Number(process.env.PORT) || 8800;

async function bootstrap(): Promise<void> {
  try {
    const container = createContainer();
    const app = createApp(container);

    app.listen(PORT, () => {
      logger.info({ port: PORT }, `Servidor iniciado`);
      logger.info(`Documentação disponível em: http://localhost:${PORT}/docs`);
    });
  } catch (err) {
    logger.error({ err }, 'Falha ao iniciar o servidor');
    process.exit(1);
  }
}

bootstrap();
