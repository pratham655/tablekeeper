
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const backendUrl =
    process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

  try {
    const response = await fetch(`${backendUrl.replace(/\/+$/, "")}/restaurants/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        "Backend restaurants error:",
        response.status,
        responseText
      );

      return NextResponse.json(
        { error: "Failed to load restaurants", details: responseText },
        { status: response.status }
      );
    }

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Backend returned invalid JSON:", responseText);
      return NextResponse.json(
        { error: "Backend returned invalid JSON" },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Restaurants API error:", error);

    return NextResponse.json(
      { error: "Unable to connect to the backend" },
      { status: 502 }
    );
  }
}
