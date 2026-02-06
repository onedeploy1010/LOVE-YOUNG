# WhatsApp Business API Setup Guide

## Prerequisites

1. A Facebook Business Account (Meta Business Suite)
2. A phone number not currently registered with WhatsApp
3. A Meta Developer Account

## Step 1: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **Create App** > Select **Business** type
3. Enter app name (e.g., "LOVE YOUNG WhatsApp")
4. Select your Business Account
5. Click **Create App**

## Step 2: Add WhatsApp Product

1. In your app dashboard, click **Add Product**
2. Find **WhatsApp** and click **Set Up**
3. Select your Business Account when prompted

## Step 3: Configure WhatsApp Business

### Get API Credentials

From the WhatsApp > Getting Started page, note down:

| Field | Description | Admin Panel Field |
|-------|-------------|-------------------|
| **Phone Number ID** | Unique ID for your WhatsApp number | `business_phone_id` |
| **WhatsApp Business Account ID** | Your WABA ID | `whatsapp_business_account_id` |
| **Temporary Access Token** | Short-lived token for testing | `access_token` |

### Generate Permanent Access Token

1. Go to **Business Settings** > **System Users**
2. Create a System User with **Admin** role
3. Click **Generate Token** and select your WhatsApp app
4. Grant permissions: `whatsapp_business_management`, `whatsapp_business_messaging`
5. Copy the permanent token and save it in the admin panel

### Configure Webhook

1. In the WhatsApp > Configuration page
2. Set **Callback URL** to your webhook endpoint:
   ```
   https://your-domain.com/api/whatsapp/webhook
   ```
3. Set **Verify Token** to a random string (save this in admin panel as `webhook_verify_token`)
4. Subscribe to webhook fields: `messages`, `message_deliveries`, `message_reads`

## Step 4: Admin Panel Configuration

Navigate to **Admin Panel > WhatsApp Business > WhatsApp Config** and fill in:

### API Configuration Tab

```json
{
  "business_phone_id": "YOUR_PHONE_NUMBER_ID",
  "whatsapp_business_account_id": "YOUR_WABA_ID",
  "access_token": "YOUR_PERMANENT_ACCESS_TOKEN",
  "webhook_verify_token": "YOUR_RANDOM_VERIFY_STRING",
  "webhook_url": "https://your-domain.com/api/whatsapp/webhook"
}
```

### Business Profile Tab

```json
{
  "business_name": "LOVE YOUNG",
  "business_description": "Premium bird's nest products",
  "business_address": "Your business address",
  "business_email": "contact@loveyoung.com",
  "business_website": "https://loveyoung.com",
  "admin_phone_numbers": ["+60123456789", "+60198765432"],
  "notification_enabled": true,
  "auto_reply_enabled": true,
  "auto_reply_message": "Thank you for your message! We will reply shortly.",
  "working_hours": {
    "start": "09:00",
    "end": "18:00",
    "timezone": "Asia/Kuala_Lumpur"
  }
}
```

## Step 5: Message Templates

WhatsApp requires pre-approved templates for business-initiated messages.

### Create Templates in Admin Panel

1. Go to **Message Templates** tab
2. Click **New Template**
3. Fill in template details:

#### Order Confirmation Template Example

```
Name: order_confirmation
Language: zh_CN
Category: UTILITY
Body: 您好 {{1}}！您的订单 #{{2}} 已确认。总金额: RM{{3}}。我们将尽快为您安排发货。
Footer: LOVE YOUNG - 感谢您的支持
```

#### Shipping Notification Template Example

```
Name: shipping_notification
Language: zh_CN
Category: UTILITY
Body: 您好 {{1}}！您的订单 #{{2}} 已发货。物流单号: {{3}}。预计 {{4}} 天内送达。
Footer: LOVE YOUNG
```

#### Welcome Message Template Example

```
Name: welcome_member
Language: zh_CN
Category: MARKETING
Body: 欢迎加入 LOVE YOUNG 会员！🎉 您已成功注册。会员ID: {{1}}。享受专属优惠和积分奖励。
Footer: LOVE YOUNG 养乐
```

### Submit Templates for Review

Templates must be approved by Meta before use. Submit through:
1. The Meta Business Suite > WhatsApp Manager > Message Templates
2. Or via the WhatsApp Business Management API

## Step 6: Admin Push Notifications

The admin push feature allows sending WhatsApp notifications to admin phones for:

- **Order notifications**: New orders, payment confirmations, shipping updates
- **Customer messages**: Incoming customer inquiries requiring attention
- **System notifications**: Low stock alerts, system errors, scheduled reports
- **Marketing push**: Campaign updates, performance alerts

### Configuration

1. Go to **Admin Push** tab in WhatsApp Config
2. Add admin phone numbers in the Business Profile tab
3. Select push type, target admins, and compose the message
4. Click Send to push immediately

## Edge Function Setup (Supabase)

For the webhook handler and message sending, deploy a Supabase Edge Function:

### Webhook Handler

```typescript
// supabase/functions/whatsapp-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // GET: Webhook verification
  if (req.method === "GET") {
    const url = new URL(req.url)
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    // Verify token against stored config
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )
    const { data: config } = await supabase
      .from("whatsapp_config")
      .select("webhook_verify_token")
      .eq("id", "default")
      .single()

    if (mode === "subscribe" && token === config?.webhook_verify_token) {
      return new Response(challenge, { status: 200 })
    }
    return new Response("Forbidden", { status: 403 })
  }

  // POST: Handle incoming messages
  if (req.method === "POST") {
    const body = await req.json()
    // Process incoming WhatsApp messages
    // Store in whatsapp_messages table
    // Trigger AI bot if configured
    return new Response("OK", { status: 200 })
  }

  return new Response("Method not allowed", { status: 405 })
})
```

### Send Message Function

```typescript
// supabase/functions/whatsapp-send/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { to, message, template_name, template_params } = await req.json()

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data: config } = await supabase
    .from("whatsapp_config")
    .select("*")
    .eq("id", "default")
    .single()

  const whatsappUrl = `https://graph.facebook.com/v18.0/${config.business_phone_id}/messages`

  const payload = template_name
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template_name,
          language: { code: "zh_CN" },
          components: template_params || []
        }
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      }

  const response = await fetch(whatsappUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  const result = await response.json()
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  })
})
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not receiving messages | Check callback URL is HTTPS and publicly accessible |
| Template rejected | Review Meta's template guidelines, avoid promotional language in UTILITY templates |
| Access token expired | Generate a new permanent token via System Users |
| Messages not sending | Verify phone number is registered and access token has correct permissions |
| 24-hour window expired | Use approved message templates for business-initiated messages outside the 24-hour window |

## API Rate Limits

- **Tier 1** (new): 1,000 business-initiated conversations per day
- **Tier 2**: 10,000 per day
- **Tier 3**: 100,000 per day
- **Tier 4**: Unlimited

Upgrade tiers by maintaining high quality rating and increasing message volume gradually.

## Security Notes

- Never expose the access token in client-side code
- Store tokens only in the `whatsapp_config` table (protected by RLS)
- Use Supabase Edge Functions for all API calls to Meta
- Rotate access tokens periodically
- Monitor webhook for suspicious activity
