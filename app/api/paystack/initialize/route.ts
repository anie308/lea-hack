// Paystack payment initialization API route
export const runtime = "nodejs"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "test_key"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, email, metadata } = body

    // Validate input
    if (!amount || !email) {
      return Response.json({ error: "Amount and email are required" }, { status: 400 })
    }

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
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/event/${metadata?.eventId}?payment=success`,
      }),
    })
    console.log("response", response)

    const data = await response.json()

    if (response.ok && data.status) {
      return Response.json(data.data)
    }

    return Response.json({ error: data.message || "Payment initialization failed" }, { status: 400 })
  } catch (error) {
    console.error("Paystack error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
