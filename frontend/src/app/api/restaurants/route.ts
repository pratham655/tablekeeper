import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Failed to fetch restaurants:", error.message);

    return NextResponse.json(
      { error: "Unable to fetch restaurants" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}