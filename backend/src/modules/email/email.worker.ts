import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMAIL_QUEUE,
  EmailMetadata,
  EMAIL_TEMPLATES,
} from './types/email.types';
import { EmailService } from './email.service';

@Processor(EMAIL_QUEUE)
@Injectable()
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<EmailMetadata, any, string>): Promise<void> {
    const { template, to, subject, context } = job.data;

    try {
      switch (template) {
        case EMAIL_TEMPLATES.welcome:
          await this.emailService.sendMail(
            EMAIL_TEMPLATES.welcome,
            to,
            subject,
            context,
          );
          this.logger.log(`📧 Welcome email sent to ${to}`, EmailWorker.name);
          break;

        case EMAIL_TEMPLATES.verification:
          await this.emailService.sendMail(
            EMAIL_TEMPLATES.verification,
            to,
            subject,
            context,
          );
          this.logger.log(
            `📧 Verification email sent to ${to}`,
            EmailWorker.name,
          );
          break;

        case EMAIL_TEMPLATES.verificationOTP:
          await this.emailService.sendMail(
            EMAIL_TEMPLATES.verificationOTP,
            to,
            subject,
            context,
          );
          this.logger.log(
            `📧 Verification OTP email sent to ${to}`,
            EmailWorker.name,
          );
          break;

        case EMAIL_TEMPLATES.passwordReset:
          await this.emailService.sendMail(
            EMAIL_TEMPLATES.passwordReset,
            to,
            subject,
            context,
          );
          this.logger.log(
            `📧 Password reset email sent to ${to}`,
            EmailWorker.name,
          );
          break;

        case EMAIL_TEMPLATES.passwordResetOTP:
          await this.emailService.sendMail(
            EMAIL_TEMPLATES.passwordResetOTP,
            to,
            subject,
            context,
          );
          this.logger.log(
            `📧 Password reset OTP email sent to ${to}`,
            EmailWorker.name,
          );
          break;

        case EMAIL_TEMPLATES.passwordChanged:
          await this.emailService.sendMail(
            EMAIL_TEMPLATES.passwordChanged,
            to,
            subject,
            context,
          );
          this.logger.log(
            `📧 Password changed email sent to ${to}`,
            EmailWorker.name,
          );
          break;

        case EMAIL_TEMPLATES.changeEmail:
          await this.emailService.sendMail(
            EMAIL_TEMPLATES.changeEmail,
            to,
            subject,
            context,
          );
          this.logger.log(
            `📧 Change email confirmation email sent to ${to}`,
            EmailWorker.name,
          );
          break;

        case EMAIL_TEMPLATES.emailChanged:
          await this.emailService.sendMail(
            EMAIL_TEMPLATES.emailChanged,
            to,
            subject,
            context,
          );
          this.logger.log(
            `📧 Email changed notification sent to ${to}`,
            EmailWorker.name,
          );
          break;

        case EMAIL_TEMPLATES.m2faOTP:
          await this.emailService.sendMail(
            EMAIL_TEMPLATES.m2faOTP,
            to,
            subject,
            context,
          );
          this.logger.log(`📧 M2FA OTP email sent to ${to}`, EmailWorker.name);
          break;

        default:
          const exhaustiveCheck: never = template;
          throw new Error(`Unknown email template: ${exhaustiveCheck}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error processing email job ${job.id}: ${error instanceof Error ? error.message : error}`,
        EmailWorker.name,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<EmailMetadata, any, string>) {
    this.logger.log(
      `✅ Email job ${job.id} completed - ${job.data.template} template sent to ${job.data.to}`,
      EmailWorker.name,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmailMetadata, any, string>, error: Error) {
    this.logger.error(
      `❌ Email job ${job.id} failed - ${job.data.template} template to ${job.data.to}: ${error.message}`,
      EmailWorker.name,
    );
  }
}
