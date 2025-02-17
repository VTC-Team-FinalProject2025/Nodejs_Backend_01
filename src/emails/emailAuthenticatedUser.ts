import nodemailer from 'nodemailer';
import { EMAIL_ADDRESS, MAIL_PASSWORD, URL_CLIENT } from '../secrets';

interface Props {
    user: any;
    resetToken: string
}
const EmailAuthenticatedUser = async ({user, resetToken}:Props) => {

  const resetUrl = `${URL_CLIENT}/form-status-auth?token=${resetToken}&user=${user.name}`;
  let htmlContent = `
      <h2>Xác thực tài khoản</h2>
      <p>Xin chào ${user.name}</p>
      <p>Bạn đã đăng ký tài khoản thành công. Vui lòng nhấp vào liên kết dưới đây để xác thực tài khoản của bạn:</p>
      <a href="${resetUrl}">Xác thực tài khoản</a>
      <p>Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,</p>
      <p>Đội ngũ hỗ trợ của chúng tôi</p>
  `;
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
    to: user.email,
    subject: 'Xác thực người dùng',
    html: htmlContent,
  });
};

export default EmailAuthenticatedUser;