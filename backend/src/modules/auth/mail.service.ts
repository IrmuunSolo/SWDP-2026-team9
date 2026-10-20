import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
@Injectable()
export class MailService {
  private readonly transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? '127.0.0.1',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER
      ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
      : {}),
    connectionTimeout: 5000,
    socketTimeout: 5000,
  });
  async sendVerification(email: string, token: string) {
    // Fragment keeps the token out of access-log query strings; web POSTs it to API.
    const url = `${process.env.WEB_ORIGIN ?? 'http://localhost:5173'}/verify-email#${token}`;
    await this.transport.sendMail({
      from: process.env.MAIL_FROM ?? 'CampusFind <noreply@example.edu>',
      to: email,
      subject: 'CampusFind бүртгэл баталгаажуулах',
      text: `24 цагийн дотор дараах холбоосоор баталгаажуулна уу:\n${url}`,
    });
  }
}
