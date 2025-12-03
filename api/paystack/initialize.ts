// This is a mock API route - in production, integrate with actual Paystack SDK
export const runtime = "nodejs"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "test_key"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, email, metadata } = body

    // In production, call Paystack API
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        email,
        metadata,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return Response.json(data.data)
    }

    return Response.json({ error: "Payment initialization failed" }, { status: 400 })
  } catch (error) {
    console.error("Paystack error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
