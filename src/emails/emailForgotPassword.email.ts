import "dotenv/config";
import { URL_CLIENT } from "../constants";
import Mailer from "../helpers/Mailer";
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
  Mailer.sendMail({ htmlContent, to: user.email, subject: "Email đặt lại mật khẩu" });
};

export default sendEmailResetPassword;
