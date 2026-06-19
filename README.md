# ♻️ DaNang Recycle Hub

Nền tảng kết nối người bán và người mua vật liệu tái chế tại Đà Nẵng, hỗ trợ giao dịch trực tuyến, quản lý điểm xanh, ví điện tử và hệ thống quản trị tập trung.

---

## 📋 Giới thiệu

**DaNang Recycle Hub** là hệ sinh thái hỗ trợ thu gom và tái chế rác thải thông minh, giúp người dân, người thu gom và doanh nghiệp tái chế kết nối với nhau thông qua nền tảng số.

Hệ thống gồm:

* 📱 Mobile App (Expo / React Native)
* 💻 Admin Dashboard (React + Vite)
* ⚙️ Backend API (Node.js + Express)
* 🔄 Realtime Socket Server
* 🗄️ MongoDB Database

---

## ✨ Tính năng chính

### Người dùng

* Đăng ký / Đăng nhập
* Xác thực Google OAuth
* Quản lý hồ sơ cá nhân
* Upload ảnh đại diện
* Quản lý ví điện tử
* Nạp / rút tiền
* Theo dõi lịch sử giao dịch
* Tích lũy điểm xanh
* Đổi thưởng

### Người bán

* Tạo đơn bán vật liệu tái chế
* Theo dõi trạng thái đơn hàng
* Xác nhận giao dịch

### Tài xế / Thu gom

* Nhận đơn thu gom
* Cập nhật trạng thái vận chuyển
* Hoàn thành giao dịch

### Quản trị viên

* Quản lý người dùng
* Quản lý đơn hàng
* Quản lý phần thưởng
* Quản lý cấu hình hệ thống
* Xem báo cáo và thống kê

### AI & Bản đồ

* Nhận diện rác bằng AI
* Hiển thị vị trí điểm thu gom
* Tìm kiếm địa điểm thông qua Goong Maps

### Realtime

* Cập nhật trạng thái giao dịch tức thời bằng WebSocket

---

# 🏗️ Kiến trúc hệ thống

```text
DaNangRecycleHub
│
├── app/                # Mobile App (Expo)
├── admin/              # Admin Dashboard (Vite + React)
├── backend/            # Express API + Socket Server
│
├── components/         # Shared UI Components
├── contexts/           # React Contexts
├── hooks/              # Custom Hooks
├── constants/          # Constants
├── assets/             # Images & Static Resources
│
└── README.md
```

---

# 🚀 Công nghệ sử dụng

## Frontend Mobile

* React Native
* Expo SDK
* Expo Router
* TypeScript

## Frontend Admin

* React
* Vite
* TailwindCSS
* TypeScript

## Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication

## Database

* MongoDB

## Third-party Services

* Google OAuth
* Supabase Storage
* Goong Maps API
* Gemini AI
* Azure Custom Vision
* Momo Payment Gateway

---

# 📦 Yêu cầu hệ thống

* Node.js 18+
* npm hoặc Yarn
* MongoDB 6+
* Git

Kiểm tra phiên bản:

```bash
node -v
npm -v
```

---

# ⚙️ Cài đặt dự án

Clone source code:

```bash
git clone <repository-url>
cd DaNangRecycleHub
```

Cài đặt dependencies:

```bash
npm install
```

hoặc

```bash
yarn install
```

---

# 🔑 Cấu hình môi trường (.env)

Tạo file `.env` từ mẫu:

```bash
cp .env.example .env
```

Hoặc tạo thủ công với các biến sau:

```env
# API
EXPO_PUBLIC_API_URL=

# Google OAuth
EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=

# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_LISTINGS_BUCKET=

# Goong API
EXPO_PUBLIC_GOONG_API_KEY=
EXPO_PUBLIC_GOONG_REST_KEY=
EXPO_PUBLIC_ENDPOINT_GOONG_REST=

# Backend
MONGO_URI=
PORT=5000

JWT_SECRET=

# Admin Panel & Github OAuth
ADMIN_WEB_ORIGIN=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ADMIN_ALLOWED_EMAILS=

# Azure Custom Vision
AZURE_CUSTOM_VISION_KEY=
AZURE_CUSTOM_VISION_ENDPOINT=
AZURE_PROJECT_ID=
AZURE_ITERATION_NAME=

# Gemini API
EXPO_PUBLIC_GEMINI_API_KEY=

# Momo Payment
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_REDIRECT_URL=
MOMO_IPN_URL=
```

---

## 📖 Giải thích các biến môi trường

| Biến                          | Mô tả                      |
| ----------------------------- | -------------------------- |
| EXPO_PUBLIC_API_URL           | URL Backend API            |
| MONGO_URI                     | Chuỗi kết nối MongoDB      |
| JWT_SECRET                    | Khóa mã hóa JWT            |
| ADMIN_WEB_ORIGIN              | Domain của Admin Dashboard |
| GITHUB_CLIENT_ID              | Github OAuth Client ID     |
| GITHUB_CLIENT_SECRET          | Github OAuth Secret        |
| EXPO_PUBLIC_SUPABASE_URL      | URL Supabase               |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Supabase Public Key        |
| EXPO_PUBLIC_GOONG_API_KEY     | Goong Maps API Key         |
| EXPO_PUBLIC_GEMINI_API_KEY    | Gemini API Key             |
| MOMO_PARTNER_CODE             | Mã đối tác Momo            |
| MOMO_ACCESS_KEY               | Access Key Momo            |
| MOMO_SECRET_KEY               | Secret Key Momo            |

---

# ▶️ Chạy Backend

```bash
cd backend

npm install

npm run dev
```

Server mặc định:

```text
http://localhost:5000
```

---

# 📱 Chạy Mobile App

```bash
cd app

npm install

npx expo start
```

Hoặc:

```bash
npx expo start --tunnel
```

Sau đó:

* Android → Expo Go
* iOS → Expo Go
* Web → Nhấn `w`

---

# 💻 Chạy Admin Dashboard

```bash
cd admin

npm install

npm run dev
```

Mặc định:

```text
http://localhost:5173
```

---

# 🔄 Realtime Socket

Socket server được khởi tạo tại:

```text
backend/socketEvents.js
```

Client kết nối thông qua:

```text
hooks/useSocket.ts
```

---

# 🧪 Kiểm thử

Backend:

```bash
cd backend

npm test
```

---

# 📂 Các file quan trọng

## Mobile

```text
app/(tabs)/profile.tsx
```

Ví dụ giao diện hồ sơ người dùng.

## Authentication

```text
contexts/AuthContext.tsx
```

Quản lý đăng nhập và token.

## Avatar Upload

```text
hooks/useAvatarUpload.ts
```

Upload ảnh đại diện lên hệ thống.

## Socket

```text
backend/socketEvents.js
```

Xử lý realtime events.

---

# 🚀 Build Production

## Mobile

Android:

```bash
eas build --platform android
```

iOS:

```bash
eas build --platform ios
```

## Admin

```bash
npm run build
```

## Backend

Khuyến nghị sử dụng:

```bash
pm2 start server.js
```

---

# 🤝 Đóng góp

1. Fork repository
2. Tạo branch mới

```bash
git checkout -b feature/new-feature
```

3. Commit

```bash
git commit -m "Add new feature"
```

4. Push

```bash
git push origin feature/new-feature
```

5. Tạo Pull Request

---

# 📄 License

This project is developed for educational and research purposes.

---

## © DaNang Recycle Hub

Xây dựng vì một Đà Nẵng xanh hơn, sạch hơn và bền vững hơn. ♻️
