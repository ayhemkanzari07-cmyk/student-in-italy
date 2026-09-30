import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    console.error("Stripe webhook signature error:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    /*
     * ONE-TIME PAYMENTS
     * Basic / Pro
     */
    if (event.type === "checkout.session.completed") {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;
      const productType = session.metadata?.product_type;
      const credits = Number(
        session.metadata?.credits || 0
      );

      if (!userId || !productType || !credits) {
        console.error("Missing checkout metadata.");

        return NextResponse.json({
          received: true,
        });
      }

      if (session.payment_status !== "paid") {
        return NextResponse.json({
          received: true,
        });
      }

      /*
       * Find the pending purchase.
       */
      const { data: purchase, error: purchaseFindError } =
        await supabase
          .from("purchases")
          .select("*")
          .eq(
            "stripe_checkout_session_id",
            session.id
          )
          .maybeSingle();

      if (purchaseFindError) {
        console.error(
          "Purchase lookup error:",
          purchaseFindError
        );

        return NextResponse.json(
          { error: "Unable to find purchase." },
          { status: 500 }
        );
      }

      if (!purchase) {
        console.error(
          "Purchase record not found:",
          session.id
        );

        return NextResponse.json({
          received: true,
        });
      }

      /*
       * Idempotency:
       * Never add credits twice for the same purchase.
       */
      if (purchase.status === "paid") {
        return NextResponse.json({
          received: true,
        });
      }

      /*
       * Get current profile.
       */
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

      if (profileError || !profile) {
        console.error(
          "Profile lookup error:",
          profileError
        );

        return NextResponse.json(
          { error: "Profile not found." },
          { status: 500 }
        );
      }

      /*
       * Add purchased credits.
       */
      const newCredits =
        Number(profile.credits || 0) + credits;

      const { error: creditError } =
        await supabase
          .from("profiles")
          .update({
            credits: newCredits,
            package_type: productType,
          })
          .eq("id", userId);

      if (creditError) {
        console.error(
          "Credit update failed:",
          creditError
        );

        return NextResponse.json(
          { error: "Unable to add credits." },
          { status: 500 }
        );
      }

      /*
       * Mark purchase as paid.
       */
      const { error: purchaseUpdateError } =
        await supabase
          .from("purchases")
          .update({
            status: "paid",
            credits_added: credits,
          })
          .eq("id", purchase.id)
          .eq("status", "pending");

      if (purchaseUpdateError) {
        console.error(
          "Purchase update failed:",
          purchaseUpdateError
        );

        return NextResponse.json(
          { error: "Unable to update purchase." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        received: true,
      });
    }

    /*
     * MONTHLY SUBSCRIPTION
     *
     * Every successful recurring invoice adds
     * 9 credits.
     */
    if (event.type === "invoice.paid") {
      const invoice =
        event.data.object as Stripe.Invoice;

      /*
       * Stripe's current TypeScript definitions may not
       * expose subscription directly on Invoice.
       * We safely read it here.
       */
      const subscriptionId =
        (
          invoice as Stripe.Invoice & {
            subscription?:
              | string
              | Stripe.Subscription;
          }
        ).subscription;

      const subscriptionIdValue =
        typeof subscriptionId === "string"
          ? subscriptionId
          : subscriptionId?.id;

      if (!subscriptionIdValue) {
        return NextResponse.json({
          received: true,
        });
      }

      const subscription =
        await stripe.subscriptions.retrieve(
          subscriptionIdValue
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

      /*
       * Get current profile.
       */
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

      if (profileError || !profile) {
        console.error(
          "Profile lookup error:",
          profileError
        );

        return NextResponse.json(
          { error: "Profile not found." },
          { status: 500 }
        );
      }

      /*
       * Add monthly credits.
       */
      const newCredits =
        Number(profile.credits || 0) + credits;

      const { error: creditError } =
        await supabase
          .from("profiles")
          .update({
            credits: newCredits,
            package_type: "monthly",
          })
          .eq("id", userId);

      if (creditError) {
        console.error(
          "Monthly credit update failed:",
          creditError
        );

        return NextResponse.json(
          { error: "Unable to add monthly credits." },
          { status: 500 }
        );
      }

      /*
       * Save / update subscription.
       */
      const firstItem =
        subscription.items.data[0];

      const periodStart =
        firstItem?.current_period_start
          ? new Date(
              firstItem.current_period_start * 1000
            ).toISOString()
          : null;

      const periodEnd =
        firstItem?.current_period_end
          ? new Date(
              firstItem.current_period_end * 1000
            ).toISOString()
          : null;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

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
                periodStart,
              current_period_end:
                periodEnd,
              cancel_at_period_end:
                subscription.cancel_at_period_end,
            },
            {
              onConflict: "user_id",
            }
          );

      if (subscriptionError) {
        console.error(
          "Subscription update failed:",
          subscriptionError
        );

        return NextResponse.json(
          { error: "Unable to update subscription." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        received: true,
      });
    }

    /*
     * Subscription status changes.
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

      const { error } = await supabase
        .from("subscriptions")
        .update({
          status,
          cancel_at_period_end:
            subscription.cancel_at_period_end,
        })
        .eq("user_id", userId);

      if (error) {
        console.error(
          "Subscription status update failed:",
          error
        );

        return NextResponse.json(
          { error: "Unable to update subscription." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        received: true,
      });
    }

    /*
     * Ignore events that we don't need.
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
      {
        status: 500,
      }
    );
  }
}