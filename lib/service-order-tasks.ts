import type { SupabaseClient } from "@supabase/supabase-js";

type ServiceOrderForTasks = {
  id?: string | null;
  title?: string | null;
  name?: string | null;
  service_name?: string | null;
  description?: string | null;
  business_profile_id?: string | null;
  project_id?: string | null;
};

type TaskInsert = {
  title: string;
  description: string | null;
  status: "todo";
  business_profile_id: string;
  project_id: string | null;
  service_order_id?: string | null;
};

const getOrderTitle = (order: ServiceOrderForTasks) =>
  order.title || order.service_name || order.name || "Service order";

const getTaskTitlesForOrder = (title: string) => {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("meta")) {
    return [
      "Audit current Meta creatives",
      "Define new creative angles",
      "Design new creatives",
      "Prepare campaign structure"
    ];
  }

  if (normalizedTitle.includes("google")) {
    return [
      "Keyword research",
      "Campaign structure setup",
      "Ad copy creation"
    ];
  }

  return [
    `Review ${title} requirements`,
    `Plan ${title} execution`,
    `Prepare ${title} deliverables`
  ];
};

export async function createTasksForServiceOrder(
  supabase: SupabaseClient,
  order: ServiceOrderForTasks
) {
  if (!order.business_profile_id) {
    console.error("SERVICE ORDER TASK CREATE MISSING BUSINESS PROFILE ID:", order);
    return { data: null, error: new Error("business_profile_id is required to create tasks") };
  }

  const orderTitle = getOrderTitle(order);
  const tasks: TaskInsert[] = getTaskTitlesForOrder(orderTitle).map((title) => ({
    title,
    description: `Generated from service order: ${orderTitle}`,
    status: "todo",
    business_profile_id: order.business_profile_id as string,
    project_id: order.project_id || null,
    service_order_id: order.id || null
  }));

  let result = await supabase
    .from("tasks")
    .insert(tasks)
    .select("*");

  if (result.error && String(result.error.message).includes("service_order_id")) {
    const tasksWithoutOrderLink = tasks.map(({ service_order_id, ...task }) => task);
    result = await supabase
      .from("tasks")
      .insert(tasksWithoutOrderLink)
      .select("*");
  }

  if (result.error) {
    console.error("SERVICE ORDER TASK CREATE ERROR:", result.error);
    return result;
  }

  console.log("Tasks created for order:", result.data);
  return result;
}
