import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const phoneRegex = /^(\+\d{1,3})?0?5[0-9]{8}$/; // Israeli mobile (after normalization)

const scheduleSchema = z
  .object({
    fullName: z.string().min(2, 'נא להזין שם מלא'),
    email: z
      .preprocess((value) => {
        if (typeof value !== 'string') return undefined;
        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      }, z.string().email('כתובת מייל לא תקינה').optional()),
    phone: z
      .preprocess((value) => {
        if (typeof value !== 'string') return undefined;
        const normalized = value.trim().replace(/[\s-]/g, '');
        return normalized.length === 0 ? undefined : normalized;
      }, z.string().regex(phoneRegex, 'מספר טלפון ישראלי לא תקין').optional()),
    company: z.string().max(120, 'שם החברה ארוך מדי').optional().or(z.literal('')),
    meetingType: z.enum(['טכנולוגי', 'ייעוץ קריירה', 'הזדמנות עסקית', 'אחר']),
    preferredDate: z.string().min(1, 'נא לבחור תאריך ושעה'),
    timeZone: z.string().min(1, 'נא לבחור אזור זמן'),
    message: z.string().max(1500, 'ההודעה ארוכה מדי').optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      const hasEmail = Boolean(data.email);
      const hasPhone = Boolean(data.phone);
      return hasEmail || hasPhone;
    },
    {
      path: ['email'],
      message: 'יש לספק כתובת מייל או מספר טלפון אחד לפחות',
    }
  )
  .refine(
    (data) => {
      if (!data.preferredDate) return false;
      const selected = new Date(data.preferredDate);
      const now = new Date();
      return selected.getTime() - now.getTime() > 1000 * 60 * 60; // לפחות שעה קדימה
    },
    {
      path: ['preferredDate'],
      message: 'נא לבחור זמן לפחות שעה קדימה',
    }
  );

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface VerificationResponse {
  verificationId: string;
  expiresAt: string;
  devCode?: string;
}

interface MeetingConfirmation {
  meetingId: string;
}

export default function MeetingScheduler() {
  const [step, setStep] = useState<'form' | 'verify' | 'confirmed'>('form');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCountdown, setVerificationCountdown] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<MeetingConfirmation | null>(null);
  const [storedData, setStoredData] = useState<ScheduleFormValues | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    mode: 'onSubmit',
  });

  const contactSummary = useMemo(() => {
    if (!storedData) return '';
    const parts = [] as string[];
    parts.push(storedData.fullName);
    if (storedData.email) parts.push(storedData.email);
    if (storedData.phone) parts.push(storedData.phone);
    if (storedData.company) parts.push(storedData.company);
    return parts.join(' · ');
  }, [storedData]);

  const handleFormSubmit = useCallback(
    async (values: ScheduleFormValues) => {
      try {
        setIsSubmitting(true);
        setVerificationError(null);
        setVerificationSuccess(false);
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }

        const response = await fetch('/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'request-code',
            payload: {
              fullName: values.fullName,
              email: values.email,
              phone: values.phone,
            },
          }),
        });

        const json = (await response.json()) as ApiResponse<VerificationResponse>;

        if (!json.success || !json.data) {
          throw new Error(json.message || 'שליחת הקוד נכשלה');
        }

        setVerificationId(json.data.verificationId);
        setStoredData(values);
        setStep('verify');
        setVerificationCountdown(90);
        if (json.data.devCode) {
          setDevCode(json.data.devCode);
        }

        // Countdown timer
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        countdownRef.current = setInterval(() => {
          setVerificationCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error) {
        console.error('Verification request failed:', error);
        setVerificationError(
          error instanceof Error ? error.message : 'שליחת הקוד נכשלה. נסו שוב.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const handleResend = useCallback(async () => {
    if (!storedData) return;
    await handleFormSubmit(storedData);
  }, [handleFormSubmit, storedData]);

  const handleVerifyCode = useCallback(
    async (code: string) => {
      if (!verificationId || !code) return;
      try {
        setIsVerifying(true);
        setVerificationError(null);

        const response = await fetch('/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'verify-code',
            payload: {
              verificationId,
              code,
            },
          }),
        });

        const json = (await response.json()) as ApiResponse;

        if (!json.success) {
          throw new Error(json.message || 'קוד אימות שגוי');
        }

        setVerificationSuccess(true);
        setVerificationError(null);
      } catch (error) {
        console.error('Verification failed:', error);
        setVerificationError(
          error instanceof Error ? error.message : 'קוד אימות שגוי. נסו שוב.'
        );
      } finally {
        setIsVerifying(false);
      }
    },
    [verificationId]
  );

  const handleFinalizeBooking = useCallback(
    async () => {
      if (!storedData || !verificationId || !verificationSuccess) return;

      try {
        setIsBooking(true);
        setVerificationError(null);

        const response = await fetch('/api/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'book',
            payload: {
              verificationId,
              details: storedData,
            },
          }),
        });

        const json = (await response.json()) as ApiResponse<MeetingConfirmation>;

        if (!json.success || !json.data) {
          throw new Error(json.message || 'קביעת הפגישה נכשלה');
        }

        setConfirmation(json.data);
        setStep('confirmed');
      } catch (error) {
        console.error('Booking failed:', error);
        setVerificationError(
          error instanceof Error ? error.message : 'קביעת הפגישה נכשלה. נסו שוב.'
        );
      } finally {
        setIsBooking(false);
      }
    },
    [storedData, verificationId, verificationSuccess]
  );

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const renderForm = () => (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200" htmlFor="fullName">
            שם מלא
          </label>
          <input
            id="fullName"
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
            placeholder="לדוגמה: אייל מזרחי"
            {...register('fullName')}
          />
          {errors.fullName && (
            <p className="text-sm text-red-400 mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200" htmlFor="company">
            חברה / ארגון (אופציונלי)
          </label>
          <input
            id="company"
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
            placeholder="שם החברה"
            {...register('company')}
          />
          {errors.company && (
            <p className="text-sm text-red-400 mt-1">{errors.company.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200" htmlFor="email">
            מייל עסקי
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
            placeholder="name@company.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200" htmlFor="phone">
            טלפון נייד
          </label>
          <input
            id="phone"
            type="tel"
            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
            placeholder="050-1234567"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-sm text-red-400 mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200" htmlFor="meetingType">
            קביעת ראיון
          </label>
          <select
            id="meetingType"
            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
            {...register('meetingType')}
          >
            <option value="טכנולוגי" className="bg-neutral-900">סקירת מערכת / סוגיה טכנולוגית</option>
            <option value="ייעוץ קריירה" className="bg-neutral-900">ייעוץ קריירה / מנטורינג</option>
            <option value="הזדמנות עסקית" className="bg-neutral-900">הזדמנות עסקית / שיתוף פעולה</option>
            <option value="אחר" className="bg-neutral-900">אחר</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-200" htmlFor="preferredDate">
            תאריך ושעה מועדפים
          </label>
          <input
            id="preferredDate"
            type="datetime-local"
            className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
            {...register('preferredDate')}
          />
          {errors.preferredDate && (
            <p className="text-sm text-red-400 mt-1">{errors.preferredDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-200" htmlFor="timeZone">
          אזור זמן מועדף
        </label>
        <select
          id="timeZone"
          className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
          {...register('timeZone')}
        >
          <option value="Asia/Jerusalem" className="bg-neutral-900">Asia/Jerusalem (GMT+2)</option>
          <option value="Europe/London" className="bg-neutral-900">Europe/London (GMT)</option>
          <option value="America/New_York" className="bg-neutral-900">America/New_York (GMT-5)</option>
          <option value="America/Los_Angeles" className="bg-neutral-900">America/Los_Angeles (GMT-8)</option>
          <option value="Asia/Singapore" className="bg-neutral-900">Asia/Singapore (GMT+8)</option>
          <option value="Other" className="bg-neutral-900">אחר (אציין בהערות)</option>
        </select>
        {errors.timeZone && (
          <p className="text-sm text-red-400 mt-1">{errors.timeZone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-200" htmlFor="message">
          רקע / נושא הפגישה (אופציונלי)
        </label>
        <textarea
          id="message"
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all resize-none"
          placeholder="ספרו לי בקצרה מה תרצו שנכסה בפגישה"
          {...register('message')}
        />
        {errors.message && (
          <p className="text-sm text-red-400 mt-1">{errors.message.message}</p>
        )}
      </div>

      <div className="rounded-xl bg-primary-500/10 border border-primary-400/30 p-4">
        <p className="text-sm text-primary-200 leading-relaxed">
          לאחר מילוי הפרטים נשלח קוד אימות למייל או לטלפון שציינתם. הזינו את הקוד כדי להשלים את קביעת הפגישה.
        </p>
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'שולח קוד אימות…' : 'שלחו קוד אימות'}
      </button>

      {verificationError && (
        <div className="rounded-xl bg-red-500/10 border border-red-400/30 p-4 text-sm text-red-300">
          {verificationError}
        </div>
      )}
    </form>
  );

  const renderVerification = () => (
    <div className="space-y-6">
      <div className="rounded-xl bg-green-500/10 border border-green-400/30 p-4">
        <p className="text-sm text-green-300">
          קוד אימות נשלח למייל או לטלפון שסיפקתם. הזינו אותו כאן להמשך.
          {devCode && (
            <span className="block text-xs mt-2 text-green-400/70">
              (מצב פיתוח) קוד לדוגמה: {devCode}
            </span>
          )}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-200" htmlFor="verificationCode">
          קוד אימות בן 6 ספרות
        </label>
        <div className="flex gap-4">
          <input
            id="verificationCode"
            type="text"
            maxLength={6}
            pattern="[0-9]*"
            inputMode="numeric"
            className="flex-1 px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all text-center text-2xl tracking-widest font-mono"
            placeholder="123456"
            onChange={(event) => {
              setVerificationError(null);
              const value = event.target.value;
              if (value.length === 6) {
                void handleVerifyCode(value);
              }
            }}
            disabled={isVerifying || verificationSuccess}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void handleVerifyCode(
              (document.getElementById('verificationCode') as HTMLInputElement | null)?.value || ''
            )}
            disabled={isVerifying || verificationSuccess}
          >
            בדוק קוד
          </button>
        </div>
      </div>

      {verificationCountdown > 0 ? (
        <p className="text-sm text-gray-400 text-center">
          ניתן לבקש קוד חדש בעוד {verificationCountdown} שניות
        </p>
      ) : (
        <button
          type="button"
          className="btn btn-secondary w-full"
          onClick={() => void handleResend()}
          disabled={isSubmitting}
        >
          שליחת קוד נוסף
        </button>
      )}

      {verificationSuccess && (
        <div className="rounded-xl bg-primary-500/10 border border-primary-400/30 p-4 text-sm text-primary-200">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>הקוד אומת בהצלחה! ניתן לקבוע פגישה.</span>
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={() => void handleFinalizeBooking()}
        disabled={!verificationSuccess || isBooking}
      >
        {isBooking ? 'קובע פגישה…' : 'סיום וקביעת פגישה'}
      </button>

      {verificationError && (
        <div className="rounded-xl bg-red-500/10 border border-red-400/30 p-4 text-sm text-red-300">
          {verificationError}
        </div>
      )}

      {storedData && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
          <p className="font-medium mb-3 text-white">פרטי הפגישה:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-primary-400">→</span>
              <span>שם: <span className="text-white">{storedData.fullName}</span></span>
            </li>
            {storedData.company && (
              <li className="flex items-center gap-2">
                <span className="text-primary-400">→</span>
                <span>חברה: <span className="text-white">{storedData.company}</span></span>
              </li>
            )}
            {storedData.email && (
              <li className="flex items-center gap-2">
                <span className="text-primary-400">→</span>
                <span>מייל: <span className="text-white">{storedData.email}</span></span>
              </li>
            )}
            {storedData.phone && (
              <li className="flex items-center gap-2">
                <span className="text-primary-400">→</span>
                <span>טלפון: <span className="text-white">{storedData.phone}</span></span>
              </li>
            )}
                 <li className="flex items-center gap-2">
                   <span className="text-primary-400">→</span>
                   <span>סוג הראיון: <span className="text-white">{storedData.meetingType}</span></span>
                 </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-400">→</span>
              <span>זמן מועדף: <span className="text-white">{new Date(storedData.preferredDate).toLocaleString('he-IL')}</span></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-400">→</span>
              <span>אזור זמן: <span className="text-white">{storedData.timeZone}</span></span>
            </li>
            {storedData.message && (
              <li className="flex items-start gap-2">
                <span className="text-primary-400 mt-1">→</span>
                <span>הערות: <span className="text-white">{storedData.message}</span></span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-white">הפגישה נקבעה בהצלחה!</h3>
      <p className="text-gray-300 leading-relaxed">
        קיבלתי את הפרטים ונחזור אליכם עם הזמנה ביומן בהקדם.
      </p>
      {storedData && (
        <div className="text-sm text-gray-400 space-y-2 bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-300">{contactSummary}</p>
          <p className="text-primary-300">
            מועד מוצע: {new Date(storedData.preferredDate).toLocaleString('he-IL')} ({storedData.timeZone})
          </p>
        </div>
      )}
      {confirmation && (
        <p className="text-xs text-gray-500">מספר בקשה: <span className="text-primary-300">{confirmation.meetingId}</span></p>
      )}
      <a href="mailto:eyal20202@gmail.com" className="btn btn-secondary inline-flex items-center justify-center">
        צרו קשר במייל
      </a>
    </div>
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">קביעת פגישה</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            זמינות בימים א׳-ה׳, 09:00-19:00 (שעון ישראל).
          </p>
        </div>
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          {watch('email') && <p>אימות ישלח ל: {watch('email')}</p>}
          {!watch('email') && watch('phone') && <p>אימות ישלח ל: {watch('phone')}</p>}
        </div>
      </div>

      {step === 'form' && renderForm()}
      {step === 'verify' && renderVerification()}
      {step === 'confirmed' && renderConfirmation()}
    </div>
  );
}
