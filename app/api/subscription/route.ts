import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { data: subscription, error } =
      await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
      console.error(
        "Subscription lookup error:",
        error
      );

      return NextResponse.json(
        { error: "Unable to load subscription." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscription: subscription ?? null,
    });
  } catch (error) {
    console.error(
      "Subscription GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load subscription.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const action = body?.action;

    if (
      action !== "cancel" &&
      action !== "reactivate"
    ) {
      return NextResponse.json(
        {
          error:
            "Action must be cancel or reactivate.",
        },
        { status: 400 }
      );
    }

    /*
     * Get the subscription belonging to this user.
     */
    const { data: subscription, error } =
      await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
      console.error(
        "Subscription lookup error:",
        error
      );

      return NextResponse.json(
        { error: "Unable to load subscription." },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        {
          error: "No subscription found.",
        },
        { status: 404 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        {
          error:
            "Stripe subscription ID is missing.",
        },
        { status: 400 }
      );
    }

    /*
     * CANCEL
     *
     * We do NOT cancel immediately.
     *
     * The user keeps access until the current
     * billing period ends.
     */
    if (action === "cancel") {
      if (subscription.status === "cancelled") {
        return NextResponse.json({
          success: true,
          message: "Subscription is already cancelled.",
        });
      }

      const updatedSubscription =
        await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            cancel_at_period_end: true,
          }
        );

      const { error: updateError } =
        await supabase
          .from("subscriptions")
          .update({
            status: updatedSubscription.status,
            cancel_at_period_end: true,
          })
          .eq("user_id", user.id);

      if (updateError) {
        console.error(
          "Database subscription update error:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              "Stripe was updated, but the local subscription record could not be updated.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "cancel",
        cancelAtPeriodEnd: true,
        currentPeriodEnd:
          subscription.current_period_end,
      });
    }

    /*
     * REACTIVATE
     *
     * This only works while the subscription is still
     * active and scheduled to cancel at period end.
     */
    if (
      subscription.status === "cancelled"
    ) {
      return NextResponse.json(
        {
          error:
            "This subscription has already ended. Start a new Monthly subscription instead.",
          requiresNewCheckout: true,
        },
        { status: 409 }
      );
    }

    const updatedSubscription =
      await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: false,
        }
      );

    const { error: updateError } =
      await supabase
        .from("subscriptions")
        .update({
          status: updatedSubscription.status,
          cancel_at_period_end: false,
        })
        .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "Database subscription update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Stripe was updated, but the local subscription record could not be updated.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action: "reactivate",
      cancelAtPeriodEnd: false,
    });
  } catch (error) {
    console.error(
      "Subscription API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Subscription operation failed.",
      },
      { status: 500 }
    );
  }
}