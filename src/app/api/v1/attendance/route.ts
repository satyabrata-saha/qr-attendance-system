import { sql } from "@/app/utils/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  console.log(body);
  const result =
    await sql`INSERT INTO attendance (user_id) VALUES (${body.name})`;

  return new Response("OK", { status: 200 });
}

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM attendance 
      ORDER BY created_at DESC
    `;

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 },
    );
  }
}
