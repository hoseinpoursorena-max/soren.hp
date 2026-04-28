import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createTasksForServiceOrder } from "@/lib/service-order-tasks";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload.business_profile_id) {
      return NextResponse.json(
        { error: "business_profile_id is required" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("service_orders")
      .insert(payload)
      .select("*")
      .single();

    if (orderError) {
      console.error("SERVICE ORDER CREATE ERROR:", orderError);
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    const taskResult = await createTasksForServiceOrder(supabase, order);

    if (taskResult.error) {
      return NextResponse.json(
        {
          order,
          task_error: taskResult.error.message
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      order,
      tasks: taskResult.data
    });
  } catch (error) {
    console.error("SERVICE ORDER CREATE ROUTE ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create service order" },
      { status: 500 }
    );
  }
}
