import { z } from 'zod';
import MeasureType from '@domain/enums/MeasureType';

const base64ImageRegex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const uploadSchema = z.object({
  body: z.object({
    image: z
      .string()
      .min(1, 'Imagem é obrigatória')
      .refine(
        (val) => {
          const raw = val.replace(/^data:[^;]+;base64,/, '');
          return base64ImageRegex.test(raw) && raw.length > 0;
        },
        { message: 'Imagem deve ser uma string base64 válida' },
      ),
    customer_code: z.string().min(1, 'Código do cliente é obrigatório'),
    measure_datetime: z.string().datetime({ message: 'Data deve estar no formato ISO 8601' }),
    measure_type: z.nativeEnum(MeasureType, {
      errorMap: () => ({ message: 'Tipo de medição inválido. Use: WATER, GAS ou ELECTRICITY' }),
    }),
  }),
});

const confirmSchema = z.object({
  body: z.object({
    measure_uuid: z.string().uuid('UUID da leitura inválido'),
    confirmed_value: z
      .number({ invalid_type_error: 'Valor confirmado deve ser um número' })
      .int('Valor confirmado deve ser um inteiro')
      .nonnegative('Valor confirmado não pode ser negativo'),
  }),
});

const listSchema = z.object({
  params: z.object({
    customer_code: z.string().min(1, 'Código do cliente é obrigatório'),
  }),
  query: z.object({
    measure_type: z
      .nativeEnum(MeasureType, {
        errorMap: () => ({ message: 'Tipo de medição inválido. Use: WATER, GAS ou ELECTRICITY' }),
      })
      .optional(),
  }),
});

type UploadBody = z.infer<typeof uploadSchema>['body'];
type ConfirmBody = z.infer<typeof confirmSchema>['body'];
type ListParams = z.infer<typeof listSchema>['params'];
type ListQuery = z.infer<typeof listSchema>['query'];

export { uploadSchema, confirmSchema, listSchema };
export type { UploadBody, ConfirmBody, ListParams, ListQuery };
