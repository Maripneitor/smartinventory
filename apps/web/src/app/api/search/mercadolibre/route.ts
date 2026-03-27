import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  return NextResponse.json({
    results: [
      {
        id: '12345',
        title: `${query} Usado en buen estado`,
        thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_612265-MLA456485-O.webp',
        price: 15600.00,
        attributes: [{ id: 'BRAND', value_name: 'Meli Brand' }],
        category_id: 'MLA1055'
      }
    ]
  });
}
