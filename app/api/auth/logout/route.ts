import { NextRequest, NextResponse } from "next/server";
import { appUrl } from "../../../../lib/config";
import { clearSession } from "../../../../lib/session";
export async function GET(_request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", appUrl()));
  clearSession(response);
  return response;
}
