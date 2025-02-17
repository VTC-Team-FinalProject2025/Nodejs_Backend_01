import nodemailer from "nodemailer";
import "dotenv/config";
import { EMAIL_ADDRESS, MAIL_PASSWORD, URL_CLIENT } from "../secrets";

const sendEmailResetPassword = async (user: any, resetToken: any) => {
  const resetUrl = `${URL_CLIENT}/reset-password?token=${resetToken}&name=${user.loginName}`;
  let htmlContent = `
      <h2>Yêu cầu đặt lại mật khẩu</h2>
      <p>Chào ${user.loginName}</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Nhấp vào liên kết dưới đây để đặt lại mật khẩu của bạn:</p>
      <a href="${resetUrl}">Đặt lại mật khẩu</a>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
      <p>Trân trọng,</p>
      <p>Đội ngũ hỗ trợ của chúng tôi</p>
  `;
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_ADDRESS,
      pass: MAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: EMAIL_ADDRESS,
    to: user.email,
    subject: "Email đặt lại mật khẩu ",
    html: htmlContent,
  });
};

export default sendEmailResetPassword;
