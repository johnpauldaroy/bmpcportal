import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export function jsonOk<T>(payload: T, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
