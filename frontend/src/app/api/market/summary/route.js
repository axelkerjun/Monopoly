// frontend/src/app/api/market/summary/route.js
import { getMarketSummary } from '@/app/utils/marketData';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  const data = await getMarketSummary(symbol);
  
  if (!data) {
    return NextResponse.json({ error: 'Unable to find this stock.' }, { status: 404 });
  }

  return NextResponse.json(data);
}
