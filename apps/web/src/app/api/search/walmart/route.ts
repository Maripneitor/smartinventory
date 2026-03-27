import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  return NextResponse.json({
    items: [
      {
        itemId: 'WAL-1122',
        name: `${query} Everyday Low Price`,
        brandName: 'Brand X',
        categoryPath: 'Home/Goods',
        imageUrl: 'https://i5.walmartimages.com/asr/7bb71d7c-9b1e-45fa-80e4-9d4133499426.3e94a5392e212f8650774a381aa37905.jpeg',
        price: 24.97,
        description: 'Great value for everyday use.'
      }
    ]
  });
}
