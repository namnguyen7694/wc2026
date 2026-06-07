import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = "https://vnexpress.net/the-thao/microservice/wc2026-score?t=1779112205024";
  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "text/csv,text/plain,application/csv",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 60 }, // Cache response for 60 seconds on Next.js server side
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch live matches: ${res.status}` }, { status: res.status });
    }

    const csvText = await res.text();
    return new Response(csvText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
