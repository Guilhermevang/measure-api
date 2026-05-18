import { Router } from 'express';
import MeasureController from '@presentation/controllers/MeasureController';
import validate from '@presentation/middlewares/validate';
import { uploadSchema, confirmSchema, listSchema } from '@presentation/schemas/measureSchemas';

function measureRoutes(controller: MeasureController): Router {
  const router = Router();

  /**
   * @openapi
   * /upload:
   *   post:
   *     tags: [Leituras]
   *     summary: Processa a imagem de um medidor
   *     description: Envia a foto de um medidor (água, gás ou energia) e recebe o valor lido pela IA.
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UploadRequest'
   *     responses:
   *       200:
   *         description: Leitura realizada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UploadResponse'
   *       400:
   *         $ref: '#/components/responses/InvalidData'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       409:
   *         $ref: '#/components/responses/DoubleReport'
   */
  router.post('/upload', validate(uploadSchema), controller.upload);

  /**
   * @openapi
   * /confirm:
   *   patch:
   *     tags: [Leituras]
   *     summary: Confirma ou corrige o valor de uma leitura
   *     description: Permite confirmar ou corrigir o valor lido pela IA. Só pode ser feito uma vez por leitura.
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ConfirmRequest'
   *     responses:
   *       200:
   *         description: Leitura confirmada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ConfirmResponse'
   *       400:
   *         $ref: '#/components/responses/InvalidData'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/MeasureNotFound'
   *       409:
   *         $ref: '#/components/responses/ConfirmationDuplicate'
   */
  router.patch('/confirm', validate(confirmSchema), controller.confirm);

  /**
   * @openapi
   * /{customer_code}/list:
   *   get:
   *     tags: [Leituras]
   *     summary: Lista as leituras de um cliente
   *     description: Retorna todas as leituras de um cliente, com filtro opcional por tipo de medidor.
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/CustomerCode'
   *       - $ref: '#/components/parameters/MeasureType'
   *     responses:
   *       200:
   *         description: Lista de leituras retornada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ListResponse'
   *       400:
   *         $ref: '#/components/responses/InvalidData'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/MeasuresNotFound'
   */
  router.get('/:customer_code/list', validate(listSchema), controller.list);

  return router;
}

export default measureRoutes;
