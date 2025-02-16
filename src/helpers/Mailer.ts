import nodemailer from 'nodemailer';
import { EMAIL_ADDRESS, MAIL_PASSWORD } from '../constants';

export type MailerProps = {
    htmlContent: string;
    to: string;
    subject: string;
}

const Mailer = {
    isEmail: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    sendMail: async ({htmlContent, to, subject}: any) => {
        if(!Mailer.isEmail(to)) {
            throw new Error("Invalid email address.");
        }
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: EMAIL_ADDRESS,
            pass: MAIL_PASSWORD,
          },
        });
      
        const info = await transporter.sendMail({
          from: EMAIL_ADDRESS,
          to,
          subject,
          html: htmlContent,
        });
      }
}

export default Mailer;