# Sử dụng Node.js trên Debian Bullseye thay vì Alpine
FROM node:20-bullseye

EXPOSE 3000

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

WORKDIR /app

# Cài đặt các thư viện cần thiết trước khi cài đặt dependencies
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*
# Sao chép package.json và cài đặt dependencies
COPY package.json ./

RUN npm install --force @img/sharp-linux-x64

# Cài đặt dependencies (bao gồm optional dependencies)
RUN npm install --include=optional --force

# Sao chép toàn bộ source code vào container
COPY . .

# Cài lại bcrypt để phù hợp với hệ thống
RUN npm rebuild bcrypt --build-from-source

COPY prisma ./schema

# # Cài đặt lại sharp đúng nền tảng
# RUN npm rebuild sharp --force
RUN npx prisma generate

# Biên dịch TypeScript
RUN npm run build

CMD ["npm", "start"]
