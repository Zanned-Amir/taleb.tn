import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_QUEUE } from './types/email.types';

@Processor(EMAIL_QUEUE)
@Injectable()
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<void> {
    this.logger.log(
      `Processing job ${job.id} with data: ${JSON.stringify(job.data)}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any, any, string>) {
    this.logger.log(`Job ${job.id} has been completed`);
  }
}
