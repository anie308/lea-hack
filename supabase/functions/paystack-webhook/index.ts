import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    // Verify Paystack signature for security
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();

    console.log('Webhook received:', { 
      hasSignature: !!signature,
      bodyLength: body.length 
    });

    // Verify webhook signature
    if (signature) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(paystackSecret);
      const messageData = encoder.encode(body);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );
      
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (hashHex !== signature) {
        console.error('Invalid webhook signature', { 
          expected: hashHex.substring(0, 20) + '...',
          received: signature.substring(0, 20) + '...'
        });
        return new Response('Invalid signature', { status: 401 });
      }
    } else {
      console.warn('No signature provided - webhook may be insecure');
    }

    const payload = JSON.parse(body);
    console.log('Webhook payload:', { 
      event: payload.event,
      reference: payload.data?.reference,
      amount: payload.data?.amount 
    });

    if (payload.event === 'charge.success') {
      // Extract metadata - handle both direct metadata and nested structure
      const metadata = payload.data.metadata || {};
      const eventId = metadata.eventId;
      const amountCents = metadata.amountCents || payload.data.amount; // Fallback to transaction amount
      const customerEmail = payload.data.customer?.email;

      // Validate required fields
      if (!eventId || !amountCents || !customerEmail) {
        console.error('Missing required fields:', { eventId, amountCents, customerEmail });
        return new Response('Missing required fields', { status: 400 });
      }

      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        console.error('Event not found:', eventError);
        return new Response('Event not found', { status: 404 });
      }

      // Generate AI tribute metadata
      const tributeMetadata = await generateTribute(event.title, amountCents);

      // Origin SDK: Register IP & Mint fractional shares
      // Note: This requires server-side Origin SDK implementation
      // For now, we'll store the contribution and handle minting separately

      // Calculate share count (e.g., 1 NGN = 100 shares)
      const shareCount = amountCents / 100;

      // Get contributor name from customer data
      const firstName = payload.data.customer?.first_name || '';
      const lastName = payload.data.customer?.last_name || '';
      const contributorName = (firstName + ' ' + lastName).trim() || customerEmail.split('@')[0];

      // Check if contribution already exists (idempotency check)
      const { data: existingContributions } = await supabase
        .from('contributions')
        .select('id')
        .eq('event_id', eventId)
        .eq('contributor_email', customerEmail)
        .eq('amount_cents', amountCents)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingContributions && existingContributions.length > 0) {
        console.log('Contribution already exists, skipping duplicate insert');
        return new Response(JSON.stringify({
          success: true,
          message: 'Contribution already recorded',
          duplicate: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Insert contribution record
      const { data: contributionData, error: contributionError } = await supabase
        .from('contributions')
        .insert({
          event_id: eventId,
          amount_cents: amountCents,
          contributor_email: customerEmail,
          contributor_name: contributorName,
          origin_share_id: null // Will be updated after minting
        })
        .select()
        .single();

      if (contributionError) {
        console.error('Failed to insert contribution:', contributionError);
        return new Response(JSON.stringify({ 
          error: 'Failed to record contribution',
          details: contributionError.message 
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log('Contribution inserted successfully:', contributionData.id);

      // Recalculate raised_cents from all contributions to avoid double-counting
      // This ensures accuracy even if webhook is called multiple times
      const { data: allContributions, error: contributionsError } = await supabase
        .from('contributions')
        .select('amount_cents')
        .eq('event_id', eventId);

      if (contributionsError) {
        console.error('Failed to fetch contributions for recalculation:', contributionsError);
        // Fallback to simple addition if query fails
        const newRaisedAmount = (event.raised_cents || 0) + amountCents;
        const { error: updateError } = await supabase
          .from('events')
          .update({ raised_cents: newRaisedAmount })
          .eq('id', eventId);

        if (updateError) {
          console.error('Failed to update event:', updateError);
          return new Response(JSON.stringify({ 
            error: 'Failed to update event raised amount',
            details: updateError.message 
          }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } else {
        // Recalculate from all contributions
        const totalRaised = allContributions.reduce((sum, contrib) => sum + (Number(contrib.amount_cents) || 0), 0);
        const { error: updateError } = await supabase
          .from('events')
          .update({ raised_cents: totalRaised })
          .eq('id', eventId);

        if (updateError) {
          console.error('Failed to update event:', updateError);
          return new Response(JSON.stringify({ 
            error: 'Failed to update event raised amount',
            details: updateError.message 
          }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        console.log('Event raised amount recalculated:', { 
          eventId, 
          totalRaised: totalRaised / 100,
          contributionCount: allContributions.length
        });
      }

      console.log('Event updated successfully:', { 
        eventId, 
        newRaisedAmount: newRaisedAmount / 100 
      });

      // TODO: Trigger Origin IP minting in a separate process
      // This would ideally be handled by a background job or separate service
      // that has access to a wallet with gas to mint the shares

      return new Response(JSON.stringify({
        success: true,
        message: 'Contribution recorded',
        shareCount
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Event not handled', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function generateTribute(title: string, amount: number): Promise<{ ipfsUri: string; description: string }> {
  // This is a placeholder for AI tribute generation
  // In production, you would:
  // 1. Call Replicate API to generate song/video/art
  // 2. Upload result to IPFS via nft.storage or similar
  // 3. Return the IPFS URI and metadata

  const description = `Thank you for contributing ₦${amount / 100} to ${title}!`;

  // Mock IPFS URI - in production, this would be the actual IPFS hash
  const ipfsUri = `ipfs://Qm${Math.random().toString(36).substring(7)}`;

  return { ipfsUri, description };
}
