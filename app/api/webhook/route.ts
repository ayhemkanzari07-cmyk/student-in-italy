import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const stripe = getStripe();

    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature." },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Stripe webhook is not configured." },
        { status: 503 }
      );
    }

    const rawBody = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error("Invalid Stripe webhook:", error);

      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    /*
     * =====================================================
     * 1. ONE-TIME PAYMENTS
     * Basic / Pro
     * =====================================================
     */

    if (event.type === "checkout.session.completed") {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;
      const productType =
        session.metadata?.product_type;

      const credits = Number(
        session.metadata?.credits || 0
      );

      if (!userId || !productType || !credits) {
        console.error(
          "Missing checkout metadata:",
          session.id
        );

        return NextResponse.json({
          received: true,
        });
      }

      /*
       * Credits are added only when Stripe confirms payment.
       */

      if (session.payment_status !== "paid") {
        return NextResponse.json({
          received: true,
          paymentStatus: session.payment_status,
        });
      }

      /*
       * Process the purchase atomically inside PostgreSQL.
       *
       * This handles:
       * - pending purchase → paid
       * - credits addition
       * - Stripe event id
       * - duplicate protection
       */

      const { data, error } = await supabase.rpc(
        "process_stripe_purchase",
        {
          p_user_id: userId,
          p_product_type: productType,
          p_credits: credits,
          p_amount_cents:
            typeof session.amount_total === "number"
              ? session.amount_total
              : 0,
          p_currency:
            session.currency || "eur",
          p_checkout_session_id: session.id,
          p_stripe_event_id: event.id,
        }
      );

      if (error) {
        console.error(
          "Stripe purchase RPC error:",
          error
        );

        return NextResponse.json(
          { error: "Purchase processing failed." },
          { status: 500 }
        );
      }

      console.log(
        "Stripe one-time payment processed:",
        data
      );

      return NextResponse.json({
        received: true,
        result: data,
      });
    }

    /*
     * =====================================================
     * 2. MONTHLY SUBSCRIPTION PAYMENT
     * =====================================================
     */

    if (event.type === "invoice.paid") {
      const invoice =
        event.data.object as Stripe.Invoice;

      const subscriptionReference =
        (
          invoice as Stripe.Invoice & {
            subscription?:
              | string
              | Stripe.Subscription;
          }
        ).subscription;

      const subscriptionId =
        typeof subscriptionReference === "string"
          ? subscriptionReference
          : subscriptionReference?.id;

      if (!subscriptionId) {
        return NextResponse.json({
          received: true,
        });
      }

      /*
       * Retrieve the current subscription from Stripe.
       */

      const subscription =
        await stripe.subscriptions.retrieve(
          subscriptionId
        );

      const userId =
        subscription.metadata?.user_id;

      const credits = Number(
        subscription.metadata?.credits || 9
      );

      if (!userId) {
        console.error(
          "Subscription user ID missing:",
          subscription.id
        );

        return NextResponse.json({
          received: true,
        });
      }

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      /*
       * Process the monthly payment atomically.
       *
       * This handles:
       * - +9 credits
       * - purchase record
       * - duplicate Stripe event protection
       */

      const { data, error } = await supabase.rpc(
        "process_stripe_monthly_payment",
        {
          p_user_id: userId,
          p_credits: credits,
          p_amount_cents: 2790,
          p_currency: "eur",
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id:
            subscription.id,
          p_stripe_payment_id:
            typeof invoice.id === "string"
              ? invoice.id
              : null,
          p_stripe_event_id: event.id,
        }
      );

      if (error) {
        console.error(
          "Monthly payment RPC error:",
          error
        );

        return NextResponse.json(
          { error: "Monthly payment processing failed." },
          { status: 500 }
        );
      }

      /*
       * Update subscription status and billing period.
       */

      const firstItem =
        subscription.items.data[0];

      const currentPeriodStart =
        firstItem?.current_period_start
          ? new Date(
              firstItem.current_period_start * 1000
            ).toISOString()
          : null;

      const currentPeriodEnd =
        firstItem?.current_period_end
          ? new Date(
              firstItem.current_period_end * 1000
            ).toISOString()
          : null;

      const { error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_subscription_id:
                subscription.id,
              stripe_customer_id: customerId,
              status: subscription.status,
              current_period_start:
                currentPeriodStart,
              current_period_end:
                currentPeriodEnd,
              cancel_at_period_end:
                subscription.cancel_at_period_end,
            },
            {
              onConflict: "user_id",
            }
          );

      if (subscriptionError) {
        console.error(
          "Subscription update error:",
          subscriptionError
        );

        return NextResponse.json(
          { error: "Subscription update failed." },
          { status: 500 }
        );
      }

      console.log(
        "Stripe monthly payment processed:",
        data
      );

      return NextResponse.json({
        received: true,
        result: data,
      });
    }

    /*
     * =====================================================
     * 3. SUBSCRIPTION STATUS CHANGES
     * =====================================================
     */

    if (
      event.type ===
        "customer.subscription.updated" ||
      event.type ===
        "customer.subscription.deleted"
    ) {
      const subscription =
        event.data.object as Stripe.Subscription;

      const userId =
        subscription.metadata?.user_id;

      if (!userId) {
        return NextResponse.json({
          received: true,
        });
      }

      const status =
        event.type ===
        "customer.subscription.deleted"
          ? "cancelled"
          : subscription.status;

      const firstItem =
        subscription.items.data[0];

      const currentPeriodStart =
        firstItem?.current_period_start
          ? new Date(
              firstItem.current_period_start * 1000
            ).toISOString()
          : null;

      const currentPeriodEnd =
        firstItem?.current_period_end
          ? new Date(
              firstItem.current_period_end * 1000
            ).toISOString()
          : null;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const { error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            stripe_subscription_id:
              subscription.id,
            stripe_customer_id: customerId,
            status,
            current_period_start:
              currentPeriodStart,
            current_period_end:
              currentPeriodEnd,
            cancel_at_period_end:
              subscription.cancel_at_period_end,
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) {
        console.error(
          "Subscription status error:",
          error
        );

        return NextResponse.json(
          { error: "Subscription update failed." },
          { status: 500 }
        );
      }

      console.log(
        `Subscription status updated: ${status}`
      );

      return NextResponse.json({
        received: true,
      });
    }

    /*
     * =====================================================
     * 4. EVENTS WE DON'T NEED
     * =====================================================
     */

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Webhook processing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}