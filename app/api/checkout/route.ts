import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStripe } from "@/lib/stripe";

const PLANS = {
  basic: {
    amount: 790,
    name: "StudentInItaly Basic",
    credits: 2,
    mode: "payment" as const,
  },

  pro: {
    amount: 1290,
    name: "StudentInItaly Pro",
    credits: 3,
    mode: "payment" as const,
  },

  monthly: {
    amount: 2790,
    name: "StudentInItaly Monthly",
    credits: 9,
    mode: "subscription" as const,
  },
};

export async function POST(request: Request) {
  try {
    // Stripe is initialized only when the API is called.
    // This allows the application to build without a Stripe key.
    const stripe = getStripe();

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // Read request body
    const body = await request.json();

    const plan = body?.plan as keyof typeof PLANS;

    // Validate selected plan
    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        {
          error: "Invalid plan.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedPlan = PLANS[plan];

    // Determine website origin
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: selectedPlan.mode,

      customer_email: user.email || undefined,

      client_reference_id: user.id,

      line_items: [
        {
          price_data: {
            currency: "eur",

            product_data: {
              name: selectedPlan.name,

              description:
                plan === "monthly"
                  ? "9 application credits every month with all Pro features."
                  : `${selectedPlan.credits} application credits with StudentInItaly.`,
            },

            unit_amount: selectedPlan.amount,

            ...(selectedPlan.mode === "subscription"
              ? {
                  recurring: {
                    interval: "month" as const,
                  },
                }
              : {}),
          },

          quantity: 1,
        },
      ],

      metadata: {
        user_id: user.id,
        product_type: plan,
        credits: String(selectedPlan.credits),
      },

      ...(selectedPlan.mode === "subscription"
        ? {
            subscription_data: {
              metadata: {
                user_id: user.id,
                product_type: plan,
                credits: String(selectedPlan.credits),
              },
            },
          }
        : {}),

      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
    });

    // Save pending purchase.
    // Credits are NOT added here.
    // They will be added only after Stripe confirms payment
    // through the webhook.
    const { error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: user.id,
        product_type: plan,
        stripe_checkout_session_id: session.id,
        credits_added: 0,
        amount_cents: selectedPlan.amount,
        currency: "eur",
        status: "pending",
      });

    if (purchaseError) {
      console.error("Purchase database error:", purchaseError);

      // Try to expire the Checkout Session if we couldn't
      // save the purchase in our database.
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error(
          "Unable to expire Stripe Checkout Session:",
          expireError
        );
      }

      return NextResponse.json(
        {
          error: "Unable to create purchase record.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create checkout session.",
      },
      {
        status: 500,
      }
    );
  }
}