import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const planId = searchParams.get('planId');
  const successUrl = searchParams.get('successUrl');
  const cancelUrl = searchParams.get('cancelUrl');
  const amount = searchParams.get('amount');

  if (!id || !planId || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Create a simple HTML page simulating a checkout gateway
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mock Checkout Gateway</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #f9fafb; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .card { background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; max-w-md: 400px; text-align: center; border: 1px solid #e5e7eb; }
          .btn { display: inline-block; padding: 0.75rem 1.5rem; border-radius: 0.375rem; font-weight: 500; cursor: pointer; text-decoration: none; border: none; margin: 0.5rem; }
          .btn-success { background: #16a34a; color: white; }
          .btn-danger { background: #dc2626; color: white; }
          h1 { margin-top: 0; color: #111827; }
          p { color: #6b7280; margin-bottom: 2rem; }
          .amount { font-size: 2rem; font-weight: 700; color: #111827; margin: 1rem 0; }
          .warning { font-size: 0.875rem; color: #f59e0b; background: #fef3c7; padding: 0.5rem; border-radius: 0.25rem; margin-bottom: 1.5rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="warning">⚠️ DEVELOPMENT MOCK PROVIDER - NO REAL MONEY IS PROCESSED</div>
          <h1>Complete Payment</h1>
          <div class="amount">₹${amount || '0.00'}</div>
          <p>Order ID: ${id}</p>
          
          <button onclick="window.location.href='${successUrl}&orderId=${id}&planId=${planId}'" class="btn btn-success">
            Simulate Success
          </button>
          
          <button onclick="window.location.href='${cancelUrl}'" class="btn btn-danger">
            Simulate Cancel
          </button>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
