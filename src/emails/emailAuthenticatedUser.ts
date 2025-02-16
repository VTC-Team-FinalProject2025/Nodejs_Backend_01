import { URL_CLIENT } from '../constants';
import Mailer from '../helpers/Mailer';

interface Props {
    user: any;
    vertifyToken: string
}
const EmailAuthenticatedUser = async ({user, vertifyToken}:Props) => {

  const resetUrl = `${URL_CLIENT}/form-status-auth?token=${vertifyToken}&user=${user.name}`;
  let htmlContent = `
      <h2>Xác thực tài khoản</h2>
      <p>Xin chào ${user.loginName}</p>
      <p>Bạn đã đăng ký tài khoản thành công. Vui lòng nhấp vào liên kết dưới đây để xác thực tài khoản của bạn:</p>
      <a href="${resetUrl}">Xác thực tài khoản</a>
      <p>Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,</p>
      <p>Đội ngũ hỗ trợ của chúng tôi</p>
  `;
  Mailer.sendMail({ htmlContent, to: user.email, subject: 'Xác thực tài khoản' });
};

export default EmailAuthenticatedUser;