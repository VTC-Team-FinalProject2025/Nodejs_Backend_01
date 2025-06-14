# Node.js API Backend

![Fox Call Logo](https://vtc-fapp.duckdns.org/_next/static/media/logoxoaphong.07c75217.png)

Backend API cho nền tảng Fox Call - nền tảng trò chuyện thoại và video hiện đại, kết nối cộng đồng theo cách thú vị và sống động với linh vật cáo công nghệ. Phù hợp cho game thủ, nhóm sáng tạo và các team làm việc.

## Công nghệ

- Node.js với Express.js
- TypeScript
- Prisma ORM
- Socket.IO cho real-time communication
- Redis cho caching
- Firebase Admin
- JWT Authentication
- OAuth2 (Google, GitHub)

## Tính năng

- RESTful API endpoints
- Real-time communication với Socket.IO
- Authentication & Authorization
   - JWT based authentication
   - OAuth2 với Google và GitHub
- File upload và xử lý ảnh
- Gửi email
- API Documentation với Swagger
- Caching với Redis
- Database migrations với Prisma

## Cài đặt

```bash
# Clone repository
git clone [repository-url]

# Cài đặt dependencies
npm install

# Thiết lập biến môi trường
cp .env.example .env
# Cập nhật các biến môi trường trong file .env

# Chạy database migrations
npm run push

# Chạy phiên bản development
npm run dev
```

## Cấu trúc dự án

```
src/
├── controllers/     # Xử lý logic nghiệp vụ
├── middlewares/     # Middleware functions
├── repositories/    # Tương tác với database
├── schemas/         # Schema validation
├── configs/         # Cấu hình ứng dụng
├── helpers/         # Các hàm tiện ích
├── swaggers/        # API documentation
├── tests/          # Unit tests
├── emails/         # Templates email
├── types/          # TypeScript type definitions
└── app.ts          # Express app configuration
```

## API Documentation

API documentation có sẵn tại `/api-docs` khi chạy server.

## Development

```bash
# Chạy tests
npm test

# Chạy Prisma Studio để quản lý database
npm run studio

# Build project
npm run build

# Chạy production
npm start
```

## Docker

```bash
# Build và chạy với Docker
docker-compose up --build
```

## Đóng góp

Chúng tôi luôn chào đón sự đóng góp từ cộng đồng. Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết thêm chi tiết về quy trình đóng góp.

## Giấy phép

Dự án này được cấp phép theo [MIT License](LICENSE).