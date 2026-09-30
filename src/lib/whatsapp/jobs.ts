import prisma from "@/lib/db/prisma";
import { getWhatsAppProvider } from "./factory";
import { MessageJobStatus, WhatsAppMessageStatus } from "@prisma/client";

export async function processPendingMessageJobs() {
  const provider = getWhatsAppProvider();

  // Find up to 50 pending jobs that are due
  const jobs = await prisma.messageJob.findMany({
    where: {
      status: {
        in: [MessageJobStatus.PENDING, MessageJobStatus.FAILED],
      },
      scheduledAt: {
        lte: new Date(),
      },
      attempts: {
        lt: 3, // Max 3 attempts
      },
    },
    take: 50,
    orderBy: {
      scheduledAt: "asc",
    },
    include: {
      tenant: true,
    },
  });

  for (const job of jobs) {
    try {
      // Optimistic lock
      const lockedJob = await prisma.messageJob.updateMany({
        where: {
          id: job.id,
          status: job.status, // Ensure it hasn't changed
        },
        data: {
          status: MessageJobStatus.PROCESSING,
          lastAttemptAt: new Date(),
        },
      });

      if (lockedJob.count === 0) {
        continue; // Someone else picked it up
      }

      const payload = job.payload as Record<string, any>;
      const content = payload.content as string;
      const customerId = payload.customerId as string | undefined;
      const feedbackRequestId = payload.feedbackRequestId as string | undefined;

      if (!content || !job.recipient) {
        throw new Error("Missing content or recipient");
      }

      const result = await provider.sendMessage({
        to: job.recipient,
        content,
        messageType: job.type,
      });

      if (result.success) {
        await prisma.$transaction([
          prisma.messageJob.update({
            where: { id: job.id },
            data: {
              status: MessageJobStatus.SENT,
              sentAt: new Date(),
              attempts: { increment: 1 },
            },
          }),
          prisma.whatsAppLog.create({
            data: {
              tenantId: job.tenantId,
              customerId,
              messageType: job.type,
              recipientMobile: job.recipient,
              providerMessageId: result.providerMessageId,
              status: WhatsAppMessageStatus.SENT,
              sentAt: new Date(),
            },
          }),
        ]);

        if (feedbackRequestId) {
          await prisma.feedbackRequest.update({
            where: { id: feedbackRequestId },
            data: { status: 'SENT' }
          }).catch(console.error);
        }
      } else {
        const attempts = job.attempts + 1;
        const status = attempts >= 3 ? MessageJobStatus.FAILED : MessageJobStatus.PENDING;
        
        await prisma.$transaction([
          prisma.messageJob.update({
            where: { id: job.id },
            data: {
              status,
              attempts,
              errorMessage: result.error,
            },
          }),
          prisma.whatsAppLog.create({
            data: {
              tenantId: job.tenantId,
              customerId,
              messageType: job.type,
              recipientMobile: job.recipient,
              status: WhatsAppMessageStatus.FAILED,
              errorMessage: result.error,
              failedAt: new Date(),
            },
          }),
        ]);
      }
    } catch (error: any) {
      const attempts = job.attempts + 1;
      const status = attempts >= 3 ? MessageJobStatus.FAILED : MessageJobStatus.PENDING;
      await prisma.messageJob.update({
        where: { id: job.id },
        data: {
          status,
          attempts,
          errorMessage: error.message || "Unknown error",
        },
      });
    }
  }
}
