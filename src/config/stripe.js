const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.warn('⚠️  Stripe secret key not found. Payment features will be disabled.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Precios de suscripción (debes crearlos en el dashboard de Stripe)
const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly'
};

module.exports = {
  stripe,
  PRICE_IDS,

  // Crear cliente de Stripe
  async createCustomer(email, name) {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          created_via: 'dicttr_api'
        }
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  },

  // Crear sesión de checkout
  async createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          subscription_type: priceId === PRICE_IDS.pro ? 'pro' : 'enterprise'
        }
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  // Crear portal de cliente para gestión de suscripción
  async createCustomerPortalSession(customerId, returnUrl) {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  },

  // Obtener suscripción por ID
  async getSubscription(subscriptionId) {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  },

  // Cancelar suscripción
  async cancelSubscription(subscriptionId) {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  // Procesar webhook de Stripe
  async handleWebhook(event) {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  },

  // Manejar actualización de suscripción
  async handleSubscriptionUpdate(subscription) {
    // Esta función se integrará con Supabase
    // para actualizar el estado del usuario
    console.log('Subscription updated:', subscription.id);
    
    // Aquí iría la lógica para actualizar la base de datos
    // con el nuevo estado de la suscripción
  },

  // Manejar cancelación de suscripción
  async handleSubscriptionCanceled(subscription) {
    console.log('Subscription canceled:', subscription.id);
    
    // Actualizar estado del usuario a "canceled"
  },

  // Manejar pago exitoso
  async handlePaymentSucceeded(invoice) {
    console.log('Payment succeeded for invoice:', invoice.id);
  },

  // Manejar pago fallido
  async handlePaymentFailed(invoice) {
    console.log('Payment failed for invoice:', invoice.id);
    
    // Actualizar estado del usuario a "past_due"
  },

  // Verificar firma del webhook
  verifyWebhookSignature(rawBody, signature) {
    if (!stripe || !stripeWebhookSecret) {
      throw new Error('Stripe webhook not configured');
    }

    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      );
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw error;
    }
  }
};