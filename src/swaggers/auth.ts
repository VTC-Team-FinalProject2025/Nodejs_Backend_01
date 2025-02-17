/**
 * @swagger
 * components:
 *   schemas:
 *     SignupInput:
 *       type: object
 *       required:
 *         - email
 *         - name
 *         - password
 *         - password_confirmation
 *       properties:
 *         email:
 *           type: string
 *           description: Email của người dùng
 *         name:
 *           type: string
 *           description: Tên của người dùng
 *         password:
 *           type: string
 *           description: Mật khẩu của người dùng
 *         password_confirmation:
 *           type: string
 *           description: Xác nhận mật khẩu
 *     LoginInput:
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
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Tên của người dùng
 *         email:
 *           type: string
 *           description: Email của người dùng
 *         password:
 *           type: string
 *           description: Mật khẩu của người dùng
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID người dùng
 *         name:
 *           type: string
 *           description: Tên của người dùng
 *         email:
 *           type: string
 *           description: Email của người dùng
 *         createAt:
 *           type: string
 *           format: date-time
 *           description: Thời điểm tạo tài khoản
 *         updateAt:
 *           type: string
 *           format: date-time
 *           description: Thời điểm cập nhật tài khoản
 */


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [User]
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
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Sai mật khẩu
 *       404:
 *         description: Tài khoản không tồn tại
 *       500:
 *         description: Lỗi server
 */


