import { NextRequest, NextResponse } from "next/server";
import { AI_SERVICE_URL } from "@/lib/serverConfig";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${AI_SERVICE_URL}/resumes/${params.id}`, {
    cache: "no-store",
  });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const payload = await req.json();
  const res = await fetch(`${AI_SERVICE_URL}/resumes/${params.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${AI_SERVICE_URL}/resumes/${params.id}`, {
    method: "DELETE",
  });
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}
