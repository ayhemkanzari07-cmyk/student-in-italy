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

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();

    // ---------------------------------------------------------
    // 1. CHECK AUTHENTICATION
    // ---------------------------------------------------------

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // ---------------------------------------------------------
    // 2. READ REQUEST
    // ---------------------------------------------------------

    const body = await request.json();

    const plan = body?.plan as keyof typeof PLANS;

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

    // ---------------------------------------------------------
    // 3. WEBSITE ORIGIN
    // ---------------------------------------------------------

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    // ---------------------------------------------------------
    // 4. CREATE STRIPE CHECKOUT SESSION
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 5. CREATE PENDING PURCHASE SAFELY
    //
    // The browser/user does NOT get direct INSERT permission
    // on purchases. Supabase creates it through a secure
    // database function.
    // ---------------------------------------------------------

    const { data: purchaseResult, error: purchaseError } =
      await supabase.rpc("create_pending_purchase", {
        p_user_id: user.id,
        p_product_type: plan,
        p_amount_cents: selectedPlan.amount,
        p_currency: "eur",
        p_checkout_session_id: session.id,
      });

    if (purchaseError || !purchaseResult?.success) {
      console.error(
        "Purchase database error:",
        purchaseError
      );

      // If database creation failed, expire the Stripe session
      // so the user cannot complete a payment that we cannot track.
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

    // ---------------------------------------------------------
    // 6. RETURN STRIPE CHECKOUT URL
    // ---------------------------------------------------------

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