/**
 * @swagger
 * components:
 *   schemas:
 *    SignupInput:
 *     type: object
 *     required:
 *       - email
 *       - firstName
 *       - lastName
 *       - loginName
 *       - phone
 *       - password
 *       - password_confirmation
 *     properties:
 *       email:
 *         type: string
 *         description: Email của người dùng
 *       firstName:
 *         type: string
 *         description: Họ của người dùng
 *       lastName:
 *         type: string
 *         description: Tên của người dùng
 *       loginName:
 *         type: string
 *         description: Tên đăng nhập của người dùng
 *       phone:
 *         type: string
 *         description: Số điện thoại của người dùng
 *       password:
 *         type: string
 *         description: Mật khẩu của người dùng
 *       password_confirmation:
 *         type: string
 *         description: Xác nhận mật khẩu
 *
 *    LoginInput:
 *       type: object
 *       required:
 *         - input
 *         - password
 *       properties:
 *         input:
 *           type: string
 *           description: Email của người dùng hoặc tên đăng nhập
 *         password:
 *           type: string
 *           description: Mật khẩu của người dùng
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  token:
 *                      type: string
 *                      example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.fhc3wykrAnRpcKApKhXiahxaOe8PSHatad31NuIZ0Zg
 *                  refresh_token:
 *                      type: string
 *                      example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.fhc3wykrAnRpcKApKhXiahxaOe8PSHatad31NuIZ0Zg
 *       400:
 *         description: Incorrect password
 *       401:
 *        description: Email is not vertify
 *       402:
 *        description: Account is blocked
 *       404:
 *         description: Account does not exist
 *       500:
 *         description: Internal Server Error
 * /auth/signup:
 *  post:
 *     summary: Đăng ký
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupInput'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  message:
 *                      type: string
 *                      example: Successful registration
 *       401:
 *         description: Password authentication mismatch
 *       400:
 *         description: Already have an account/Phone number already exists/Login name already exists
 *       500:
 *         description: Internal Server Error
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Internal Server Error
 *
 * /auth/forgot-password:
 *   post:
 *     summary: Quên mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email của người dùng
 *     responses:
 *       200:
 *         description: Successful email person
 *       400:
 *         description: Email not filled in/Not an email address
 *       404:
 *         description: This email does not exist
 *       500:
 *         description: Internal Server Error
 *
 * /auth/verify-email:
 *   post:
 *     summary: Xác thực email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token xác thực
 *     responses:
 *       200:
 *         description: Vertify email successful
 *       400:
 *         description: Token is invalid
 *       401:
 *        description: Email is already vertify
 *       404:
 *         description: Token not found
 *       500:
 *         description: Internal Server Error
 * /auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token trả về từ api forget password
 *               password:
 *                type: string
 *                description: Mật khẩu mới
 *               password_confirmation:
 *                type: string
 *                description: Xác nhận mật khẩu mới
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Token is invalid
 *       401:
 *        description: Password authentication mismatch
 *       404:
 *         description: Token not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Làm mới token truy cập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token hợp lệ để lấy token mới
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.fhc3wykrAnRpcKApKhXiahxaOe8PSHatad31NuIZ0Zg
 *     responses:
 *       200:
 *         description: Trả về access token và refresh token mới
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.fhc3wykrAnRpcKApKhXiahxaOe8PSHatad31NuIZ0Zg
 *                 refresh_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.fhc3wykrAnRpcKApKhXiahxaOe8PSHatad31NuIZ0Zg
 *       400:
 *         description: Thiếu refresh token hoặc token không hợp lệ
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi server
 */
