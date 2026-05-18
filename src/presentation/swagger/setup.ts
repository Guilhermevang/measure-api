import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meter Reading API',
      version: '2.0.0',
      description:
        'API para leitura automática de medidores de água, gás e energia elétrica via inteligência artificial (Google Gemini).',
      contact: {
        name: 'Guilherme Evangelista',
        url: 'https://github.com/Guilhermevang',
      },
    },
    servers: [
      {
        url: '{baseUrl}/api',
        description: 'Servidor',
        variables: {
          baseUrl: {
            default: 'http://localhost:8800',
            description: 'URL base da aplicação',
          },
        },
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description:
            'Chave de autenticação. Obrigatória se a variável API_KEY estiver configurada no servidor.',
        },
      },
      parameters: {
        CustomerCode: {
          name: 'customer_code',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identificador único do cliente',
          example: 'cliente-001',
        },
        MeasureType: {
          name: 'measure_type',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['WATER', 'GAS', 'ELECTRICITY'] },
          description: 'Filtra as leituras por tipo de medidor',
        },
      },
      schemas: {
        UploadRequest: {
          type: 'object',
          required: ['image', 'customer_code', 'measure_datetime', 'measure_type'],
          properties: {
            image: {
              type: 'string',
              description: 'Foto do medidor codificada em base64 (JPEG ou PNG)',
              example: '/9j/4AAQSkZJRgABAQEASABIAAD...',
            },
            customer_code: {
              type: 'string',
              description: 'Identificador do cliente',
              example: 'cliente-001',
            },
            measure_datetime: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora da leitura no formato ISO 8601',
              example: '2024-08-15T10:30:00Z',
            },
            measure_type: {
              type: 'string',
              enum: ['WATER', 'GAS', 'ELECTRICITY'],
              description: 'Tipo de medidor',
              example: 'WATER',
            },
          },
        },
        UploadResponse: {
          type: 'object',
          properties: {
            image_url: {
              type: 'string',
              description: 'URL da imagem armazenada',
              example: 'http://localhost:8800/images/abc123-water-meter.jpg',
            },
            measure_value: {
              type: 'integer',
              description: 'Valor lido pela IA no medidor',
              example: 12345,
            },
            measure_uuid: {
              type: 'string',
              format: 'uuid',
              description: 'Identificador único da leitura',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        },
        ConfirmRequest: {
          type: 'object',
          required: ['measure_uuid', 'confirmed_value'],
          properties: {
            measure_uuid: {
              type: 'string',
              format: 'uuid',
              description: 'UUID da leitura a ser confirmada',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            confirmed_value: {
              type: 'integer',
              minimum: 0,
              description: 'Valor confirmado ou corrigido pelo usuário',
              example: 12350,
            },
          },
        },
        ConfirmResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
          },
        },
        ListResponse: {
          type: 'object',
          properties: {
            customer_code: {
              type: 'string',
              example: 'cliente-001',
            },
            measures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  measure_uuid: { type: 'string', format: 'uuid' },
                  measure_datetime: { type: 'string', format: 'date-time' },
                  measure_type: {
                    type: 'string',
                    enum: ['WATER', 'GAS', 'ELECTRICITY'],
                  },
                  has_confirmed: { type: 'boolean' },
                  image_url: { type: 'string' },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error_code: { type: 'string', example: 'INVALID_DATA' },
            error_description: { type: 'string', example: 'Descrição do erro' },
          },
        },
      },
      responses: {
        InvalidData: {
          description: 'Dados inválidos na requisição',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error_code: 'INVALID_DATA', error_description: 'Imagem deve ser uma string base64 válida' },
            },
          },
        },
        Unauthorized: {
          description: 'API Key ausente ou inválida',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error_code: 'UNAUTHORIZED', error_description: 'API Key ausente ou inválida' },
            },
          },
        },
        DoubleReport: {
          description: 'Já existe uma leitura para esse tipo no mês atual',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error_code: 'DOUBLE_REPORT', error_description: 'Já existe uma leitura para esse tipo no mês atual' },
            },
          },
        },
        MeasureNotFound: {
          description: 'Leitura não encontrada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error_code: 'MEASURE_NOT_FOUND', error_description: 'Leitura não encontrada' },
            },
          },
        },
        MeasuresNotFound: {
          description: 'Nenhuma leitura encontrada para o cliente',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error_code: 'MEASURES_NOT_FOUND', error_description: 'Nenhuma leitura encontrada para o cliente informado' },
            },
          },
        },
        ConfirmationDuplicate: {
          description: 'Leitura já confirmada anteriormente',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { error_code: 'CONFIRMATION_DUPLICATE', error_description: 'Leitura já foi confirmada anteriormente' },
            },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
  },
  apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../routes/*.js')],
};

function setupSwagger(app: Express): void {
  const spec = swaggerJsdoc(options);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
  app.get('/docs.json', (_req, res) => res.json(spec));
}

export default setupSwagger;
