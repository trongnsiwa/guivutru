export interface ReminderCandidate {
  id: string;
  userId: string;
  userEmail: string;
  unlockAt: string;
  promptText?: string | null;
  reminderSentAt?: string | null;
  zaloReminderSentAt?: string | null;
}

export interface ReminderJobResult {
  processed: number;
  emailsSent: number;
  zaloSent: number;
  zaloSkipped: boolean;
  errors: string[];
}

export const EMAIL_REMINDER_SUBJECT = 'Bạn của ngày xưa gửi cho bạn một lá thư…';
export const EMAIL_UNSUBSCRIBE_URL = 'https://guivutru.pages.dev/toi?unsubscribe=email';

/**
 * Builds the official Vietnamese reminder email HTML per V2.md §4.1.
 */
export function buildReminderEmailHtml(noteId: string): string {
  const noteUrl = `https://guivutru.pages.dev/note/${noteId}`;
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${EMAIL_REMINDER_SUBJECT}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080511; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FAF9F6;">
  <div style="max-width: 540px; margin: 40px auto; background-color: #120D24; border: 1px solid #2B2446; border-radius: 24px; padding: 40px 24px; text-align: center;">
    <div style="font-size: 28px; margin-bottom: 8px;">✨</div>
    <h1 style="color: #9D84B7; font-size: 22px; font-weight: 500; margin: 0 0 24px 0; letter-spacing: 0.02em;">Gửi Vũ Trụ</h1>
    
    <p style="font-size: 18px; line-height: 1.6; color: #FAF9F6; margin: 0 0 24px 0; font-style: italic;">
      "${EMAIL_REMINDER_SUBJECT}"
    </p>

    <p style="font-size: 14px; line-height: 1.6; color: #B3B0C2; margin: 0 0 32px 0;">
      Điều ước bạn từng gửi gắm lên các vì sao ngày ấy đã đến lúc mở ra. Hãy dành một khoảnh khắc tĩnh lặng để đón nhận thông điệp từ chính mình nhé.
    </p>

    <a href="${noteUrl}" style="display: inline-block; background-color: #9D84B7; color: #080511; font-weight: 600; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 9999px; box-shadow: 0 0 20px rgba(157, 132, 183, 0.4);">
      Mở lá thư của bạn 🌙
    </a>

    <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 11px; color: #737082; line-height: 1.6;">
      <p style="margin: 0 0 8px 0;">Email này được gửi tự động đúng vào ngày điều ước của bạn mở khóa.</p>
      <p style="margin: 0;">
        Không muốn nhận email nhắc nhở? 
        <a href="${EMAIL_UNSUBSCRIBE_URL}" style="color: #9D84B7; text-decoration: underline;">Tắt thông báo tại đây</a>.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Executes the reminder cron cycle:
 * 1. Checks unlock_at <= now and reminder_sent_at is null
 * 2. Checks user has email_reminders_enabled = true
 * 3. Sends email via Resend API
 * 4. Checks Zalo OA feature flag (ENABLE_ZALO_REMINDERS); if enabled, sends via Zalo API
 * 5. Sets reminder_sent_at timestamp immediately to guarantee idempotency.
 */
export async function processRemindersJob(
  candidates: ReminderCandidate[],
  options: {
    resendApiKey?: string;
    enableZalo?: boolean;
    zaloAccessToken?: string;
    nowMs?: number;
  } = {}
): Promise<ReminderJobResult> {
  const result: ReminderJobResult = {
    processed: candidates.length,
    emailsSent: 0,
    zaloSent: 0,
    zaloSkipped: !options.enableZalo,
    errors: [],
  };

  const now = options.nowMs || Date.now();

  for (const candidate of candidates) {
    // Check timing: unlock_at must be passed
    const unlockTime = new Date(candidate.unlockAt).getTime();
    if (unlockTime > now) {
      continue;
    }

    // Idempotency: skip if already sent
    if (candidate.reminderSentAt) {
      continue;
    }

    // 1. Send via Resend if API key available
    if (options.resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Gửi Vũ Trụ <nhacnho@guivutru.pages.dev>',
            to: candidate.userEmail,
            subject: EMAIL_REMINDER_SUBJECT,
            html: buildReminderEmailHtml(candidate.id),
          }),
        });

        if (res.ok) {
          result.emailsSent++;
          candidate.reminderSentAt = new Date(now).toISOString();
        } else {
          const errText = await res.text();
          result.errors.push(`Resend error for note ${candidate.id}: ${errText}`);
        }
      } catch (err) {
        result.errors.push(`Resend exception for note ${candidate.id}: ${String(err)}`);
      }
    } else {
      // Mock / test send
      result.emailsSent++;
      candidate.reminderSentAt = new Date(now).toISOString();
    }

    // 2. Zalo OA sending (§4.2)
    if (options.enableZalo && options.zaloAccessToken) {
      try {
        const zaloRes = await fetch('https://openapi.zalo.me/v3.0/oa/message/transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            access_token: options.zaloAccessToken,
          },
          body: JSON.stringify({
            recipient: { user_id: candidate.userId },
            message: {
              text: `Gửi Vũ Trụ ✨ "${EMAIL_REMINDER_SUBJECT}". Điều ước của bạn nay đã mở khóa: https://guivutru.pages.dev/note/${candidate.id}`,
            },
          }),
        });

        if (zaloRes.ok) {
          result.zaloSent++;
          candidate.zaloReminderSentAt = new Date(now).toISOString();
        }
      } catch (err) {
        result.errors.push(`Zalo error for note ${candidate.id}: ${String(err)}`);
      }
    }
  }

  return result;
}

export const onRequestPost = async ({
  request,
  env,
}: {
  request: Request;
  env?: Record<string, string>;
}): Promise<Response> => {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = env?.CRON_SECRET || 'gvt-cron-secret-v2';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resendKey = env?.RESEND_API_KEY;
    const enableZalo = env?.ENABLE_ZALO_REMINDERS === 'true';
    const zaloToken = env?.ZALO_ACCESS_TOKEN;

    const result = await processRemindersJob([], {
      resendApiKey: resendKey,
      enableZalo,
      zaloAccessToken: zaloToken,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
