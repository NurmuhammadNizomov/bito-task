import { Request, Response } from 'express';
import * as webhookService from './webhook.service';
import { asyncHandler } from '../../common/utils/async-handler';
import { accepted } from '../../common/utils/api-response';

interface WebhookRequest extends Request {
  rawBody?: string;
}

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = (req.headers['x-webhook-signature'] as string) || '';
  const rawBody = (req as WebhookRequest).rawBody || JSON.stringify(req.body);
  const result = await webhookService.handleWebhookEvent(rawBody, signature, req.body);
  accepted(res, result, 'webhook.accepted');
});
