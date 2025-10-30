import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import Stripe from 'stripe';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('stripe/webhook')
  async webhook(@Req() req: any, @Body() body: any, @Headers('stripe-signature') sig: string) {
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (whSecret && (this as any).payments['stripe']) {
      const stripe = (this as any).payments['stripe'] as Stripe;
      const event = stripe.webhooks.constructEvent(Buffer.from(JSON.stringify(body)), sig, whSecret);
      await this.payments.handleStripeWebhook(event);
      return { received: true };
    } else {
      // accept as mock
      if (body?.type && body?.data?.object?.metadata?.orderId) {
        await this.payments.handleStripeWebhook(body as any);
      }
      return { received: true };
    }
  }
}


