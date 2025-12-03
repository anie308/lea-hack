// Paystack payment verification API route
// This verifies a payment directly from Paystack API as a fallback if webhook hasn't processed yet
export const runtime = "nodejs"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "test_key"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return Response.json({ error: "Payment reference is required" }, { status: 400 })
    }

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok || !data.status) {
      return Response.json({ error: data.message || "Payment verification failed" }, { status: 400 })
    }

    // Check if payment was successful
    if (data.data.status === 'success') {
      const metadata = data.data.metadata || {}
      const eventId = metadata.eventId
      const amountCents = metadata.amountCents || data.data.amount
      const customerEmail = data.data.customer?.email

      return Response.json({
        success: true,
        verified: true,
        eventId,
        amountCents,
        customerEmail,
        transaction: data.data,
      })
    }

    return Response.json({
      success: false,
      verified: false,
      status: data.data.status,
    })
  } catch (error) {
    console.error("Paystack verification error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

