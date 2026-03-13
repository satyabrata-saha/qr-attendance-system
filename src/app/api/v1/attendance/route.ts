import { sql } from "@/app/utils/db";

export async function POST(request: Request) {
  const body = await request.json();
  console.log(body);
  const result =
    await sql`INSERT INTO attendance (user_id) VALUES (${body.name})`;

  return new Response("OK", { status: 200 });
}
