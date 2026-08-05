import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { sendBroadcastMail } from './broadcastMail';
import { sendEventMail } from './mail';

export type MailJobType = 'BROADCAST' | 'REGISTRATION';

export interface BroadcastMailPayload {
  type: 'BROADCAST';
  to: string;
  recipientName?: string;
  subject: string;
  headerBannerUrl?: string | null;
  bodyHtml: string;
  batchId?: string;
}

export interface RegistrationMailPayload {
  type: 'REGISTRATION';
  to: string;
  subject: string;
  event: any;
  registration: any;
  regType: 'PENDING' | 'CONFIRMED';
  originUrl: string;
}

export type MailJobPayload = BroadcastMailPayload | RegistrationMailPayload;

export const QUEUE_NAME = 'mail-broadcast-queue';
export const DAILY_LIMIT = 90; // 90 emails max per 24 hours (Resend Free Tier Limit)
export const BATCH_DELAY_MS = 3000; // 3 seconds gap between mails

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const createRedisConnection = () => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
};

// In-memory fallback store for daily limit & local job execution if Redis connection fails
let localDailyCount = {
  date: new Date().toISOString().split('T')[0],
  count: 0,
};

function getDailyCountKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculates remaining milliseconds until daily quota resets at Midnight UTC (00:00:05 UTC)
 */
export function getMsUntilDailyReset(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 5));
  const diff = tomorrow.getTime() - now.getTime();
  // Fallback to at least 1 hour if calculation edge case
  return diff > 0 ? diff : 3600000;
}

export async function getTodaySentCount(): Promise<number> {
  const today = getDailyCountKey();
  if (localDailyCount.date !== today) {
    localDailyCount = { date: today, count: 0 };
  }
  
  try {
    const conn = createRedisConnection();
    const val = await conn.get(`mail_daily_limit:${today}`);
    await conn.quit();
    if (val) return parseInt(val, 10);
  } catch (err) {
    // Fallback to local memory count
  }
  return localDailyCount.count;
}

export async function incrementTodaySentCount(): Promise<number> {
  const today = getDailyCountKey();
  if (localDailyCount.date !== today) {
    localDailyCount = { date: today, count: 0 };
  }
  localDailyCount.count += 1;

  try {
    const conn = createRedisConnection();
    const newCount = await conn.incr(`mail_daily_limit:${today}`);
    await conn.expire(`mail_daily_limit:${today}`, 172800); // 48 hour TTL
    await conn.quit();
    return newCount;
  } catch (err) {
    return localDailyCount.count;
  }
}

export interface MailJobLog {
  id: string;
  to: string;
  subject: string;
  jobType: MailJobType;
  status: 'QUEUED' | 'SENDING' | 'COMPLETED' | 'FAILED' | 'DELAYED_FOR_NEXT_DAY_RESET';
  scheduledDelaySec: number;
  rescheduledForTomorrow?: boolean;
  timestamp: string;
  error?: string;
}

export const recentMailLogs: MailJobLog[] = [];

let mailQueue: Queue<MailJobPayload> | null = null;
let mailWorker: Worker<MailJobPayload> | null = null;

/**
 * Execute mail dispatch based on payload type
 */
async function processMailPayload(payload: MailJobPayload): Promise<{ success: boolean; error?: string }> {
  if (payload.type === 'REGISTRATION') {
    return await sendEventMail({
      to: payload.to,
      subject: payload.subject,
      event: payload.event,
      registration: payload.registration,
      type: payload.regType,
      originUrl: payload.originUrl,
    });
  } else {
    return await sendBroadcastMail({
      to: payload.to,
      recipientName: payload.recipientName,
      subject: payload.subject,
      headerBannerUrl: payload.headerBannerUrl,
      bodyHtml: payload.bodyHtml,
    });
  }
}

try {
  const connection = createRedisConnection();
  mailQueue = new Queue<MailJobPayload>(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  });

  // BullMQ Worker processing queue with rate limiting & automatic quota rollover delay
  mailWorker = new Worker<MailJobPayload>(
    QUEUE_NAME,
    async (job: Job<MailJobPayload>) => {
      const payload = job.data;
      console.log(`[BullMQ Worker] Processing ${payload.type} mail for ${payload.to}...`);

      const currentSent = await getTodaySentCount();
      
      // If Resend daily quota (90/day) is reached, DO NOT DISCARD JOB! Delay until tomorrow's reset.
      if (currentSent >= DAILY_LIMIT) {
        const delayUntilTomorrowMs = getMsUntilDailyReset();
        const delayMinutes = Math.round(delayUntilTomorrowMs / 60000);
        console.warn(`[BullMQ Worker] Resend daily limit (${DAILY_LIMIT}) reached. Delaying job for ${payload.to} by ${delayMinutes} minutes until daily reset.`);

        recentMailLogs.unshift({
          id: job.id || `job-${Date.now()}`,
          to: payload.to,
          subject: payload.subject,
          jobType: payload.type,
          status: 'DELAYED_FOR_NEXT_DAY_RESET',
          scheduledDelaySec: Math.round(delayUntilTomorrowMs / 1000),
          rescheduledForTomorrow: true,
          timestamp: new Date().toLocaleTimeString(),
          error: `Quota limit of ${DAILY_LIMIT} reached today. Job delayed ${delayMinutes} min until tomorrow's reset. No emails lost!`,
        });

        // Re-enqueue job to BullMQ with delay until tomorrow's reset
        if (mailQueue) {
          await mailQueue.add(job.name, payload, {
            delay: delayUntilTomorrowMs,
            jobId: `delayed-quota-${job.id}-${Date.now()}`,
          });
        }
        return { delayedUntilTomorrow: true, delayMs: delayUntilTomorrowMs };
      }

      const result = await processMailPayload(payload);

      if (result.success) {
        await incrementTodaySentCount();
        recentMailLogs.unshift({
          id: job.id || `job-${Date.now()}`,
          to: payload.to,
          subject: payload.subject,
          jobType: payload.type,
          status: 'COMPLETED',
          scheduledDelaySec: Math.round((job.delay || 0) / 1000),
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        recentMailLogs.unshift({
          id: job.id || `job-${Date.now()}`,
          to: payload.to,
          subject: payload.subject,
          jobType: payload.type,
          status: 'FAILED',
          scheduledDelaySec: Math.round((job.delay || 0) / 1000),
          timestamp: new Date().toLocaleTimeString(),
          error: result.error,
        });
        throw new Error(result.error || 'Mail sending failed');
      }

      return { sent: true, recipient: payload.to };
    },
    {
      connection,
      concurrency: 1, // Enforce 1-by-1 batch dispatching
      limiter: {
        max: 1,
        duration: BATCH_DELAY_MS, // 3-second gap between mails
      },
    }
  );

  mailWorker.on('error', (err) => {
    console.warn('[BullMQ Worker Notice]:', err.message);
  });
} catch (err) {
  console.warn('[BullMQ Initialization Notice]: Operating with resilient memory queue fallback.');
}

/**
 * Enqueue a registration email job to BullMQ
 */
export async function enqueueRegistrationMail(payload: Omit<RegistrationMailPayload, 'type'>): Promise<{ queued: boolean; jobId: string }> {
  const fullPayload: RegistrationMailPayload = { ...payload, type: 'REGISTRATION' };
  const jobId = `reg-mail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  let enqueued = false;
  if (mailQueue) {
    try {
      await mailQueue.add('send-registration-mail', fullPayload, { jobId });
      enqueued = true;
    } catch (e) {
      // Fallback below
    }
  }

  if (!enqueued) {
    // Async delayed runner with automatic quota rollover delay
    setTimeout(async () => {
      try {
        const sentNow = await getTodaySentCount();
        if (sentNow >= DAILY_LIMIT) {
          const delayMs = getMsUntilDailyReset();
          console.warn(`[Fallback Runner] Daily limit reached. Holding registration email for ${payload.to} until tomorrow's reset (${Math.round(delayMs / 60000)} mins).`);
          
          recentMailLogs.unshift({
            id: jobId,
            to: payload.to,
            subject: payload.subject,
            jobType: 'REGISTRATION',
            status: 'DELAYED_FOR_NEXT_DAY_RESET',
            scheduledDelaySec: Math.round(delayMs / 1000),
            rescheduledForTomorrow: true,
            timestamp: new Date().toLocaleTimeString(),
            error: `Daily limit reached. Email safely queued for tomorrow's reset.`,
          });

          // Reschedule execution after reset
          setTimeout(async () => {
            await sendEventMail({
              to: payload.to,
              subject: payload.subject,
              event: payload.event,
              registration: payload.registration,
              type: payload.regType,
              originUrl: payload.originUrl,
            });
            await incrementTodaySentCount();
          }, delayMs);
          return;
        }

        const res = await sendEventMail({
          to: payload.to,
          subject: payload.subject,
          event: payload.event,
          registration: payload.registration,
          type: payload.regType,
          originUrl: payload.originUrl,
        });

        if (res.success) {
          await incrementTodaySentCount();
          recentMailLogs.unshift({
            id: jobId,
            to: payload.to,
            subject: payload.subject,
            jobType: 'REGISTRATION',
            status: 'COMPLETED',
            scheduledDelaySec: 0,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } catch (err) {
        console.error('[Fallback Registration Mail Error]:', err);
      }
    }, 100);
  } else {
    recentMailLogs.unshift({
      id: jobId,
      to: payload.to,
      subject: payload.subject,
      jobType: 'REGISTRATION',
      status: 'QUEUED',
      scheduledDelaySec: 0,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  return { queued: true, jobId };
}

/**
 * Enqueue broadcast email batch to BullMQ
 */
export async function enqueueBroadcastBatch(
  recipients: { email: string; name?: string }[],
  subject: string,
  bodyHtml: string,
  headerBannerUrl?: string | null
): Promise<{
  enqueuedCount: number;
  delayedForTomorrowCount: number;
  totalSentToday: number;
  remainingToday: number;
  logs: MailJobLog[];
}> {
  const currentSentToday = await getTodaySentCount();
  const remainingLimit = Math.max(0, DAILY_LIMIT - currentSentToday);

  let delayedForTomorrowCount = 0;
  const batchId = `batch-${Date.now()}`;
  const newLogs: MailJobLog[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const isOverTodayLimit = i >= remainingLimit;
    
    // Calculate delay: 3s gap per item for today, OR delay until tomorrow's reset if over limit
    const baseGapMs = i * BATCH_DELAY_MS;
    const delayMs = isOverTodayLimit ? (getMsUntilDailyReset() + (i - remainingLimit) * BATCH_DELAY_MS) : baseGapMs;

    if (isOverTodayLimit) {
      delayedForTomorrowCount++;
    }

    const payload: BroadcastMailPayload = {
      type: 'BROADCAST',
      to: r.email,
      recipientName: r.name,
      subject,
      headerBannerUrl,
      bodyHtml,
      batchId,
    };

    const jobId = `mail-bcast-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;

    let enqueuedWithBullMQ = false;
    if (mailQueue) {
      try {
        await mailQueue.add('send-broadcast-mail', payload, {
          delay: delayMs,
          jobId,
        });
        enqueuedWithBullMQ = true;
      } catch (err) {
        // Fallback
      }
    }

    if (!enqueuedWithBullMQ) {
      setTimeout(async () => {
        try {
          const sentNow = await getTodaySentCount();
          if (sentNow >= DAILY_LIMIT) {
            const extraDelay = getMsUntilDailyReset();
            console.warn(`[Fallback Worker] Daily limit reached. Rescheduling ${r.email} for tomorrow.`);
            recentMailLogs.unshift({
              id: jobId,
              to: r.email,
              subject,
              jobType: 'BROADCAST',
              status: 'DELAYED_FOR_NEXT_DAY_RESET',
              scheduledDelaySec: Math.round(extraDelay / 1000),
              rescheduledForTomorrow: true,
              timestamp: new Date().toLocaleTimeString(),
              error: `Limit hit today. Mail safely held until tomorrow's reset.`,
            });
            setTimeout(async () => {
              await sendBroadcastMail({
                to: r.email,
                recipientName: r.name,
                subject,
                headerBannerUrl,
                bodyHtml,
              });
              await incrementTodaySentCount();
            }, extraDelay);
            return;
          }

          const res = await sendBroadcastMail({
            to: r.email,
            recipientName: r.name,
            subject,
            headerBannerUrl,
            bodyHtml,
          });

          if (res.success) {
            await incrementTodaySentCount();
            recentMailLogs.unshift({
              id: jobId,
              to: r.email,
              subject,
              jobType: 'BROADCAST',
              status: 'COMPLETED',
              scheduledDelaySec: Math.round(delayMs / 1000),
              timestamp: new Date().toLocaleTimeString(),
            });
          }
        } catch (e: any) {
          console.error('[Fallback Broadcast Mail Runner error]:', e);
        }
      }, delayMs);
    }

    const logEntry: MailJobLog = {
      id: jobId,
      to: r.email,
      subject,
      jobType: 'BROADCAST',
      status: isOverTodayLimit ? 'DELAYED_FOR_NEXT_DAY_RESET' : 'QUEUED',
      scheduledDelaySec: Math.round(delayMs / 1000),
      rescheduledForTomorrow: isOverTodayLimit,
      timestamp: new Date().toLocaleTimeString(),
    };

    newLogs.push(logEntry);
    recentMailLogs.unshift(logEntry);
  }

  if (recentMailLogs.length > 100) {
    recentMailLogs.length = 100;
  }

  return {
    enqueuedCount: recipients.length,
    delayedForTomorrowCount,
    totalSentToday: currentSentToday,
    remainingToday: Math.max(0, remainingLimit - recipients.length),
    logs: newLogs,
  };
}
