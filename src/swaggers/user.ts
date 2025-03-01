/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateLoginNameInput:
 *       type: object
 *       required:
 *         - newLoginName
 *       properties:
 *         newLoginName:
 *           type: string
 *           description: Tên đăng nhập mới
 * 
 *     UpdateNameInput:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *       properties:
 *         firstName:
 *           type: string
 *           description: Họ của người dùng
 *         lastName:
 *           type: string
 *           description: Tên của người dùng
 * 
 *     UpdatePasswordInput:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *           description: Mật khẩu cũ
 *         newPassword:
 *           type: string
 *           description: Mật khẩu mới
 *         confirmPassword:
 *           type: string
 *           description: Xác nhận mật khẩu mới
 */

/**
 * @swagger
 * /user/update-login-name:
 *   put:
 *     summary: Cập nhật tên đăng nhập
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLoginNameInput'
 *     responses:
 *       200:
 *         description: Cập nhật tên đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "LoginName updated successfully"
 *       400:
 *         description: Người dùng chưa đủ 14 ngày để đổi tên đăng nhập
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi máy chủ
 */

/**
 * @swagger
 * /user/update-name:
 *   put:
 *     summary: Cập nhật họ và tên
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNameInput'
 *     responses:
 *       200:
 *         description: Cập nhật họ và tên thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Full name updated successfully"
 *       500:
 *         description: Lỗi máy chủ
 */

/**
 * @swagger
 * /user/update-password:
 *   put:
 *     summary: Cập nhật mật khẩu
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordInput'
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Mật khẩu cũ không đúng hoặc mật khẩu mới không khớp
 *       404:
 *         description: Người dùng không tồn tại
 *       500:
 *         description: Lỗi máy chủ
 */