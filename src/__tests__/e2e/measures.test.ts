import request from 'supertest';
import { createDatabase } from '@infrastructure/database/db';
import SqliteMeasureRepository from '@infrastructure/database/SqliteMeasureRepository';
import MockMeterReader from '../helpers/MockMeterReader';
import MockImageStorage from '../helpers/MockImageStorage';
import createApp from '../../app';
import { AppContainer } from '@shared/container';
import Database from 'better-sqlite3';

/**
 * Cria uma instância da app com banco em memória e mocks para os serviços externos.
 * Isso garante que os testes E2E não dependam do Gemini nem do sistema de arquivos.
 */
function createTestApp(meterReadValue = 12345) {
  const db: Database.Database = createDatabase(':memory:');

  const container: AppContainer = {
    db,
    measureRepository: new SqliteMeasureRepository(db),
    meterReaderService: new MockMeterReader(meterReadValue),
    imageStorage: new MockImageStorage(),
  };

  return { app: createApp(container), db };
}

const validBase64 = Buffer.from('fake-image-content').toString('base64');

describe('POST /api/upload', () => {
  it('deve retornar 200 com os dados da leitura ao processar uma imagem válida', async () => {
    const { app } = createTestApp();

    const res = await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-15T10:00:00Z',
      measure_type: 'WATER',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      measure_value: 12345,
      image_url: expect.stringContaining('/images/'),
      measure_uuid: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    });
  });

  it('deve retornar 400 quando o body está incompleto', async () => {
    const { app } = createTestApp();

    const res = await request(app).post('/api/upload').send({
      customer_code: 'cliente-001',
    });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_DATA');
  });

  it('deve retornar 400 quando o tipo de medição é inválido', async () => {
    const { app } = createTestApp();

    const res = await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-15T10:00:00Z',
      measure_type: 'INVALID_TYPE',
    });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_DATA');
  });

  it('deve retornar 409 quando já existe uma leitura do tipo no mesmo mês', async () => {
    const { app } = createTestApp();

    // Primeira leitura
    await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-01T08:00:00Z',
      measure_type: 'WATER',
    });

    // Segunda tentativa no mesmo mês
    const res = await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-20T12:00:00Z',
      measure_type: 'WATER',
    });

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe('DOUBLE_REPORT');
  });

  it('deve permitir leituras de tipos diferentes no mesmo mês', async () => {
    const { app } = createTestApp();

    await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-01T08:00:00Z',
      measure_type: 'WATER',
    });

    const res = await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-01T08:00:00Z',
      measure_type: 'GAS',
    });

    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/confirm', () => {
  it('deve confirmar uma leitura existente com sucesso', async () => {
    const { app } = createTestApp();

    const uploadRes = await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-15T10:00:00Z',
      measure_type: 'GAS',
    });

    const { measure_uuid } = uploadRes.body;

    const res = await request(app)
      .patch('/api/confirm')
      .send({ measure_uuid, confirmed_value: 15000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('deve retornar 404 para UUID inexistente', async () => {
    const { app } = createTestApp();

    const res = await request(app).patch('/api/confirm').send({
      measure_uuid: '00000000-0000-4000-a000-000000000000',
      confirmed_value: 100,
    });

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('MEASURE_NOT_FOUND');
  });

  it('deve retornar 409 ao tentar confirmar uma leitura já confirmada', async () => {
    const { app } = createTestApp();

    const uploadRes = await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-15T10:00:00Z',
      measure_type: 'ELECTRICITY',
    });

    const { measure_uuid } = uploadRes.body;

    await request(app)
      .patch('/api/confirm')
      .send({ measure_uuid, confirmed_value: 500 });

    const res = await request(app)
      .patch('/api/confirm')
      .send({ measure_uuid, confirmed_value: 600 });

    expect(res.status).toBe(409);
    expect(res.body.error_code).toBe('CONFIRMATION_DUPLICATE');
  });

  it('deve retornar 400 para UUID com formato inválido', async () => {
    const { app } = createTestApp();

    const res = await request(app)
      .patch('/api/confirm')
      .send({ measure_uuid: 'nao-e-um-uuid', confirmed_value: 100 });

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_DATA');
  });
});

describe('GET /api/:customer_code/list', () => {
  it('deve listar todas as leituras de um cliente', async () => {
    const { app } = createTestApp();

    await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-01T00:00:00Z',
      measure_type: 'WATER',
    });

    await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-01T00:00:00Z',
      measure_type: 'GAS',
    });

    const res = await request(app).get('/api/cliente-001/list');

    expect(res.status).toBe(200);
    expect(res.body.customer_code).toBe('cliente-001');
    expect(res.body.measures).toHaveLength(2);
  });

  it('deve filtrar leituras por tipo', async () => {
    const { app } = createTestApp();

    await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-01T00:00:00Z',
      measure_type: 'WATER',
    });

    await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-01T00:00:00Z',
      measure_type: 'GAS',
    });

    const res = await request(app).get('/api/cliente-001/list?measure_type=WATER');

    expect(res.status).toBe(200);
    expect(res.body.measures).toHaveLength(1);
    expect(res.body.measures[0].measure_type).toBe('WATER');
  });

  it('deve retornar 400 para tipo de filtro inválido', async () => {
    const { app } = createTestApp();

    const res = await request(app).get('/api/cliente-001/list?measure_type=INVALIDO');

    expect(res.status).toBe(400);
    expect(res.body.error_code).toBe('INVALID_DATA');
  });

  it('deve retornar 404 quando o cliente não possui leituras', async () => {
    const { app } = createTestApp();

    const res = await request(app).get('/api/cliente-sem-leituras/list');

    expect(res.status).toBe(404);
    expect(res.body.error_code).toBe('MEASURES_NOT_FOUND');
  });

  it('deve retornar has_confirmed como true após confirmação', async () => {
    const { app } = createTestApp();

    const uploadRes = await request(app).post('/api/upload').send({
      image: validBase64,
      customer_code: 'cliente-001',
      measure_datetime: '2024-08-01T00:00:00Z',
      measure_type: 'WATER',
    });

    await request(app)
      .patch('/api/confirm')
      .send({ measure_uuid: uploadRes.body.measure_uuid, confirmed_value: 99 });

    const listRes = await request(app).get('/api/cliente-001/list');

    expect(listRes.body.measures[0].has_confirmed).toBe(true);
  });
});
