const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://lyftora.in',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const BASE_HEADERS = {
  ...CORS_HEADERS,
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: BASE_HEADERS });
}

/* ── OPTIONS (CORS preflight) ── */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS, 'Cache-Control': 'no-store' },
  });
}

/* ── POST /api/waitlist ── */
export async function onRequestPost(context) {
  const { request, env, ctx } = context;

  /* Parse body */
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_request' }, 400);
  }

  const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
  const source = (typeof body.source === 'string' ? body.source : 'lyftora.in').slice(0, 100);
  const ref = (typeof body.ref === 'string' ? body.ref : null)?.slice(0, 200) ?? null;

  /* Validate email */
  if (!email || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  /* Rate limit: max 5 per IP per hour via KV */
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const rlKey = `rl:${ip}:${Math.floor(Date.now() / 3_600_000)}`;
  try {
    const raw = await env.RATE_LIMIT_KV.get(rlKey);
    const count = raw ? parseInt(raw, 10) : 0;
    if (count >= 5) {
      return json({ ok: false, error: 'rate_limited' }, 429);
    }
    /* Await the KV put for race-free rate limiting */
    await env.RATE_LIMIT_KV.put(rlKey, String(count + 1), { expirationTtl: 3600 });
  } catch (err) {
    /* KV failure is non-fatal — log and continue */
    console.error('[waitlist] KV error:', err);
  }

  /* Compute ip_hash: SHA-256(ip + IP_SALT), first 16 hex chars */
  let ip_hash = null;
  try {
    if (!env.IP_SALT) console.warn('[waitlist] IP_SALT not set — ip_hash is unsalted');
    const salt = env.IP_SALT || '';
    const buf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(ip + salt)
    );
    ip_hash = Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
  } catch (err) {
    console.error('[waitlist] hash error:', err);
  }

  const country = request.cf?.country ?? null;
  const user_agent = (request.headers.get('User-Agent') || '').slice(0, 300);

  /* Insert into Supabase */
  const supabaseUrl = env.SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('[waitlist] SUPABASE_URL is not set');
    return json({ ok: false, error: 'server_error' }, 500);
  }
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    console.error('[waitlist] SUPABASE_SERVICE_ROLE_KEY is not set');
    return json({ ok: false, error: 'server_error' }, 500);
  }

  let position = null;
  try {
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({ email, source, ref, ip_hash, user_agent, country }),
    });

    if (!insertRes.ok) {
      const detail = await insertRes.text();
      console.error('[waitlist] Supabase insert error', insertRes.status, detail);
      return json({ ok: false, error: 'server_error' }, 500);
    }

    /* Cheap count for position */
    try {
      const countRes = await fetch(
        `${supabaseUrl}/rest/v1/waitlist?select=count`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'count=exact',
            'Range-Unit': 'items',
            Range: '0-0',
          },
        }
      );
      const contentRange = countRes.headers.get('Content-Range') || '';
      const match = contentRange.match(/\/(\d+)$/);
      if (match) position = parseInt(match[1], 10);
    } catch (err) {
      console.warn('[waitlist] count query failed, position omitted:', err);
    }
  } catch (err) {
    console.error('[waitlist] Supabase fetch error:', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }

  /* Fire-and-forget confirmation email via Resend */
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('[waitlist] RESEND_API_KEY is not set');
  } else {
    const fromAddress = env.RESEND_FROM || 'onboarding@resend.dev';
    if (!env.RESEND_FROM) {
      console.warn('[waitlist] RESEND_FROM not set — using onboarding@resend.dev fallback');
    }

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f6f3ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ea;padding:48px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#f6f3ea;max-width:560px;width:100%;">
        <tr><td style="padding:0 32px 28px;">
          <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#0E0E12;">Lyftora<span style="color:#FF5A3C;">.</span></p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          <p style="margin:0 0 16px;font-size:22px;font-weight:600;color:#0E0E12;line-height:1.3;">
            You're on the list — we'll email you the moment we ship.
          </p>
          <p style="margin:0 0 24px;font-size:16px;color:#6B6A63;line-height:1.6;">
            Thanks for joining the Lyftora waitlist. We're building an AI personal trainer that doesn't charge rent — personalised plans, real food, no monthly fee.
          </p>
          <p style="margin:0;font-size:16px;color:#6B6A63;line-height:1.6;">
            We'll only email you when it matters.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px 48px;border-top:1px solid rgba(14,14,18,0.1);">
          <p style="margin:0;font-size:12px;color:#9B9A93;line-height:1.6;">
            &copy; ${new Date().getFullYear()} Lyftora &middot; lyftora.in<br/>
            Reply STOP and we'll remove you immediately.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const emailText = `You're on the Lyftora list.\n\nWe'll email you the moment we ship. Thanks for joining.\n\n— The Lyftora team\nhttps://lyftora.in\n\nReply STOP and we'll remove you immediately.`;

    ctx.waitUntil(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: "You're on the Lyftora list.",
          html: emailHtml,
          text: emailText,
        }),
      }).then(async r => {
        if (!r.ok) {
          console.error('[waitlist] Resend error', r.status, await r.text());
        }
      }).catch(err => {
        console.error('[waitlist] Resend fetch error:', err);
      })
    );
  }

  return json({ ok: true, ...(position !== null ? { position } : {}) });
}

/* ── Catch-all: 405 for GET, HEAD, PUT, PATCH, DELETE ── */
export async function onRequest(context) {
  return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: {
      ...BASE_HEADERS,
      Allow: 'POST, OPTIONS',
    },
  });
}
