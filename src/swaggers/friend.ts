/**
 * @swagger
 * components:
 *   schemas:
 *     MakeFriendRequest:
 *       type: object
 *       required:
 *         - receiverId
 *       properties:
 *         receiverId:
 *           type: number
 *           description: ID của người nhận yêu cầu kết bạn
 *     AcceptFriendRequest:
 *       type: object
 *       required:
 *         - senderId
 *       properties:
 *         senderId:
 *           type: number
 *           description: ID của người gửi yêu cầu kết bạn
 *     FriendAction:
 *       type: object
 *       required:
 *         - senderId
 *       properties:
 *         senderId:
 *           type: number
 *           description: ID của người cần thực hiện hành động (xác nhận, hủy, chặn, mở chặn)
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /friend/make-friend:
 *   post:
 *     summary: Gửi yêu cầu kết bạn
 *     tags: [Friend]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MakeFriendRequest'
 *     responses:
 *       200:
 *         description: Yêu cầu kết bạn đã được gửi thành công
 *       404:
 *         description: Không thể gửi yêu cầu kết bạn cho chính bạn hoặc mối quan hệ đã tồn tại
 */

/**
 * @swagger
 * /friend/accept-friend:
 *   put:
 *     summary: Chấp nhận yêu cầu kết bạn
 *     tags: [Friend]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcceptFriendRequest'
 *     responses:
 *       200:
 *         description: Yêu cầu kết bạn đã được chấp nhận thành công
 *       404:
 *         description: Yêu cầu kết bạn không tồn tại
 */

/**
 * @swagger
 * /friend/block-friend:
 *   put:
 *     summary: Chặn bạn
 *     tags: [Friend]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FriendAction'
 *     responses:
 *       200:
 *         description: Người bạn đã bị chặn thành công
 *       404:
 *         description: Mối quan hệ kết bạn không tồn tại
 */

/**
 * @swagger
 * /friend/lists-friend:
 *   get:
 *     summary: Lấy danh sách bạn bè
 *     tags: [Friend]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bản ghi trên mỗi trang
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *         example: John
 *     responses:
 *       200:
 *         description: Danh sách bạn bè được trả về thành công
 */

/**
 * @swagger
 * /friend/friend-request-list:
 *   get:
 *     summary: Lấy danh sách yêu cầu kết bạn
 *     tags: [Friend]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang hiện tại
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng bản ghi trên mỗi trang
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *         example: John
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu kết bạn được trả về thành công
 */

/**
 * @swagger
 * /friend/cancel-friend:
 *   delete:
 *     summary: Hủy yêu cầu kết bạn
 *     tags: [Friend]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FriendAction'
 *     responses:
 *       200:
 *         description: Yêu cầu kết bạn đã được hủy thành công
 *       404:
 *         description: Yêu cầu kết bạn không tồn tại
 */

/**
 * @swagger
 * /friend/unfriend:
 *   delete:
 *     summary: Hủy kết bạn
 *     tags: [Friend]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FriendAction'
 *     responses:
 *       200:
 *         description: Đã hủy kết bạn thành công
 *       404:
 *         description: Mối quan hệ kết bạn không tồn tại
 */

/**
 * @swagger
 * /friend/unblock:
 *   delete:
 *     summary: Mở chặn bạn
 *     tags: [Friend]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FriendAction'
 *     responses:
 *       200:
 *         description: Mở chặn thành công
 *       404:
 *         description: Mối quan hệ kết bạn không tồn tại
 */
