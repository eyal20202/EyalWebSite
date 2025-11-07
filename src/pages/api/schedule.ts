import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

interface VerificationEntry {
  code: string;
  expiresAt: number;
  verified: boolean;
  contact: {
    fullName: string;
    email?: string;
    phone?: string;
  };
}

interface MeetingEntry {
  id: string;
  verificationId: string;
  details: ScheduleDetails;
  createdAt: number;
}

const verificationStore = new Map<string, VerificationEntry>();
const meetingsStore = new Map<string, MeetingEntry>();

const requestSchema = z.object({
  action: z.enum(['request-code', 'verify-code', 'book']),
  payload: z.record(z.any()).optional(),
});

const contactSchema = z.object({
  fullName: z.string().min(2),
  email: z
    .string()
    .email()
    .optional(),
  phone: z
    .string()
    .regex(/^(\+\d{1,3})?0?5[0-9]{8}$/)
    .optional(),
});

const verificationSchema = z.object({
  verificationId: z.string().uuid(),
  code: z.string().length(6),
});

const scheduleSchema = z.object({
  verificationId: z.string().uuid(),
  details: z.object({
    fullName: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    meetingType: z.string(),
    preferredDate: z.string(),
    timeZone: z.string(),
    message: z.string().optional(),
  }),
});

type ScheduleDetails = z.infer<typeof scheduleSchema>['details'];

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpiredVerifications() {
  const now = Date.now();
  for (const [id, entry] of verificationStore.entries()) {
    if (entry.expiresAt < now) {
      verificationStore.delete(id);
    }
  }
}

function createMeeting(details: ScheduleDetails, verificationId: string): MeetingEntry {
  const meetingId = `meet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const meeting: MeetingEntry = {
    id: meetingId,
    verificationId,
    details,
    createdAt: Date.now(),
  };
  meetingsStore.set(meetingId, meeting);
  return meeting;
}

async function handleRequestCode(payload: unknown) {
  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ success: false, message: 'פרטים לא תקינים', errors: parsed.error.errors }),
      { status: 400 }
    );
  }

  const { fullName, email, phone } = parsed.data;
  if (!email && !phone) {
    return new Response(
      JSON.stringify({ success: false, message: 'נדרש מייל או טלפון לאימות' }),
      { status: 400 }
    );
  }

  cleanExpiredVerifications();

  const verificationId = randomUUID();
  const code = generateCode();
  const expiresAt = Date.now() + 1000 * 60 * 10; // 10 minutes

  verificationStore.set(verificationId, {
    code,
    expiresAt,
    verified: false,
    contact: { fullName, email, phone },
  });

  // TODO: Send the code via email/SMS here using your provider of choice.
  console.info('[schedule] Verification code generated', {
    verificationId,
    destination: email ?? phone,
    code,
  });

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        verificationId,
        expiresAt: new Date(expiresAt).toISOString(),
        devCode: import.meta.env.DEV ? code : undefined,
      },
    }),
    { status: 200 }
  );
}

async function handleVerifyCode(payload: unknown) {
  const parsed = verificationSchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ success: false, message: 'אימות לא תקין' }),
      { status: 400 }
    );
  }

  const { verificationId, code } = parsed.data;
  const entry = verificationStore.get(verificationId);

  if (!entry) {
    return new Response(
      JSON.stringify({ success: false, message: 'האימות פג או אינו קיים' }),
      { status: 404 }
    );
  }

  if (entry.expiresAt < Date.now()) {
    verificationStore.delete(verificationId);
    return new Response(
      JSON.stringify({ success: false, message: 'תוקף הקוד פג, יש לבקש קוד חדש' }),
      { status: 410 }
    );
  }

  if (entry.code !== code) {
    return new Response(
      JSON.stringify({ success: false, message: 'קוד אימות שגוי' }),
      { status: 401 }
    );
  }

  entry.verified = true;
  verificationStore.set(verificationId, entry);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

async function handleBook(payload: unknown) {
  const parsed = scheduleSchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ success: false, message: 'נתוני פגישה לא תקינים' }),
      { status: 400 }
    );
  }

  const { verificationId, details } = parsed.data;
  const entry = verificationStore.get(verificationId);

  if (!entry) {
    return new Response(
      JSON.stringify({ success: false, message: 'האימות אינו קיים' }),
      { status: 404 }
    );
  }

  if (!entry.verified) {
    return new Response(
      JSON.stringify({ success: false, message: 'יש להשלים אימות קוד לפני קביעת פגישה' }),
      { status: 401 }
    );
  }

  const meeting = createMeeting(details, verificationId);

  console.info('[schedule] Meeting booked', {
    meetingId: meeting.id,
    fullName: entry.contact.fullName,
    email: entry.contact.email,
    phone: entry.contact.phone,
    preferredDate: details.preferredDate,
    meetingType: details.meetingType,
  });

  // After booking we can remove verification to prevent reuse
  verificationStore.delete(verificationId);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        meetingId: meeting.id,
      },
    }),
    { status: 200 }
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, message: 'בקשה לא תקינה' }),
        { status: 400 }
      );
    }

    const { action, payload } = parsed.data;

    switch (action) {
      case 'request-code':
        return await handleRequestCode(payload);
      case 'verify-code':
        return await handleVerifyCode(payload);
      case 'book':
        return await handleBook(payload);
      default:
        return new Response(
          JSON.stringify({ success: false, message: 'פעולה אינה נתמכת' }),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[schedule] Internal error', error);
    return new Response(
      JSON.stringify({ success: false, message: 'שגיאה פנימית בשרת' }),
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ success: false, message: 'Method not allowed' }),
    { status: 405 }
  );
};
