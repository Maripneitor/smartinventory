import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

  return NextResponse.json({
    products: [
      {
        sku: 'BEST-5678',
        name: `${query} Premium Edition`,
        manufacturer: 'Sony',
        image: 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6500/6500335_sd.jpg',
        salePrice: 499.99,
        description: 'Exclusive Best Buy bundle.',
        category: 'Electronics',
        attributes: { color: 'White' }
      }
    ]
  });
}
