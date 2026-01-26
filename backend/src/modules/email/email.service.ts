import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { promises as fs } from 'fs';
import Handlebars from 'handlebars';
import { I18nService } from 'nestjs-i18n';
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly currentConfig: {
    host: string;
    port: number;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
    secure: boolean;
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    // Determine environment and select appropriate config
    const isProduction =
      this.configService.getOrThrow<string>('NODE_ENV') === 'production';

    this.logger.log(
      `📧 Email service initialized for ${isProduction ? 'PRODUCTION' : 'TEST'}`,
      'EmailService',
    );

    this.currentConfig = {
      host: isProduction
        ? this.configService.getOrThrow<string>('EMAIL_HOST')
        : this.configService.getOrThrow<string>('EMAIL_HOST_TEST'),
      port: isProduction
        ? this.configService.getOrThrow<number>('EMAIL_PORT')
        : this.configService.getOrThrow<number>('EMAIL_PORT_TEST'),
      auth: {
        user: isProduction
          ? this.configService.getOrThrow<string>('EMAIL_USER')
          : this.configService.getOrThrow<string>('EMAIL_USER_TEST'),
        pass: isProduction
          ? this.configService.getOrThrow<string>('EMAIL_PASSWORD')
          : this.configService.getOrThrow<string>('EMAIL_PASSWORD_TEST'),
      },
      from: isProduction
        ? this.configService.getOrThrow<string>('EMAIL_FROM')
        : this.configService.getOrThrow<string>('EMAIL_FROM_TEST'),
      secure: isProduction
        ? this.configService.getOrThrow<boolean>('IS_EMAIL_SECURE')
        : this.configService.getOrThrow<boolean>('IS_EMAIL_SECURE_TEST'),
    };

    this.registerHandlebarsHelpers();
    this.transporter = this.createTransporter();
  }

  private registerHandlebarsHelpers() {
    const i18nService = this.i18n;
    const logger = this.logger;

    Handlebars.registerHelper('t', function (key: string, options?: any) {
      try {
        const lang = options?.data?.root?.lang || 'en';
        const args = options?.hash || {};

        const translation = i18nService.t(key, { lang, args });

        return new Handlebars.SafeString(String(translation));
      } catch (error) {
        return key;
      }
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
  }

  private createTransporter() {
    return nodemailer.createTransport({
      host: this.currentConfig.host,
      port: this.currentConfig.port,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: this.currentConfig.auth.user,
        pass: this.currentConfig.auth.pass,
      },
    });
  }

  private async renderTemplate(
    templateName: string,
    data: any,
  ): Promise<string> {
    const name = `${templateName}.hbs`;
    const templatePath = path.join(
      process.cwd(),
      'src/modules/email/templates',
      name,
    );
    const template = await fs.readFile(templatePath, 'utf-8');

    // Compile with strict: false to allow undefined helpers to be called
    const compiledTemplate = Handlebars.compile(template);

    // Prepare context with language
    const lang = data.lang || 'en';
    const contextWithLang = {
      ...data,
      lang,
    };

    const html = compiledTemplate(contextWithLang);

    return html;
  }

  async sendMail(template: string, to: string, subject: string, context: any) {
    const html = await this.renderTemplate(template, context);

    const mailOptions = {
      from: this.currentConfig.from,
      to,
      subject,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent to ${to}`, 'EmailService');
      return info;
    } catch (error) {
      this.logger.error(
        `Error sending email to ${to}: ${error instanceof Error ? error.message : error}`,
        'EmailService',
      );
      throw new Error('Error sending email');
    }
  }
}
