# DaNang Recycle Hub

Mô tả ngắn: DaNang Recycle Hub là nền tảng di động/web để kết nối người bán và người mua vật liệu tái chế tại Đà Nẵng. Ứng dụng bao gồm ứng dụng mobile (Expo/React Native), trang quản trị (admin), và backend (Node/Express) để xử lý xác thực, giao dịch, và realtime socket.

**Chức năng chính**
- Người dùng: đăng ký/đăng nhập, cập nhật hồ sơ, tải ảnh đại diện, xem lịch sử giao dịch, quản lý ví và điểm xanh.
- Ví tiền & nạp/rút: nạp tiền, rút tiền (API tích hợp Momo/mode thử nghiệm).
- Điểm & phần thưởng: tích điểm xanh khi tái chế, đổi quà ở trang Rewards.
- Người bán/tài xế: quản lý đơn bán, xác nhận giao dịch.
- Quản trị (admin): quản lý danh sách, cấu hình, xem báo cáo (giao diện admin trong thư mục `admin/`).
- Realtime: cập nhật trạng thái giao dịch qua WebSocket (thư mục `backend/socketEvents.js`).

**Kiến trúc dự án**
- `app/` — Ứng dụng Expo (React Native) cho mobile + routing (app router). File chính chỉnh sửa UI nằm trong `app/(tabs)/`.
- `admin/` — Frontend quản trị (Vite + React).
- `backend/` — API server Node/Express, socket, controllers, models.
- `components/`, `hooks/`, `contexts/`, `constants/` — dùng chung cho frontend mobile.

Hướng dẫn nhanh (development)

1. Cài đặt môi trường

	- Node.js (phiên bản LTS) và Yarn/npm.
	- Đối với mobile: cài Expo CLI toàn cục nếu cần: `npm install -g expo-cli`.

2. Cài dependencies (root dùng workspaces)

```bash
# tại thư mục gốc
npm install
# hoặc nếu dùng yarn
yarn install
```

3. Chạy backend (thư mục `backend/`)

```bash
cd backend
npm install
npm run dev
```

4. Chạy mobile (Expo)

```bash
# từ thư mục gốc
cd app
npm install
npx expo start
```

5. Chạy admin

```bash
cd admin
npm install
npm run dev
```

6. Biến môi trường

	- Mobile: cấu hình `EXPO_PUBLIC_API_URL` trong `.env` (ở root hoặc `app/`) để trỏ tới backend local hoặc remote.
	- Admin/backend: xem các file `.env` tương ứng trong `backend/` và `admin/` nếu có.

Ghi chú vận hành & phát triển
- Khi thay đổi API, cập nhật `backend/routes` và kiểm tra `controllers`.
- Socket realtime nằm trong `backend/socketEvents.js`; client mobile kết nối qua `useSocket` hook.
- Các thành phần phổ biến đặt trong `components/`, tái sử dụng cho mobile.

Kiểm tra nhanh

```bash
# chạy test backend (nếu có)
cd backend
npm test
```

Tài nguyên hữu ích
- Cấu trúc mobile: xem `app/(tabs)/profile.tsx` để ví dụ UI, animation và chỉnh sửa hồ sơ.
- Hooks: `hooks/useAvatarUpload.ts` để upload avatar.
- Contexts: `contexts/AuthContext.tsx` để quản lý xác thực và token.

Nếu bạn muốn, mình có thể:
- Dọn dẹp README chi tiết hơn theo từng môi trường (dev/staging/prod).
- Thêm mục Contribution & Coding style.
- Tạo script helper để khởi động toàn bộ stack (backend + admin + expo) bằng một lệnh.

---
© DaNang Recycle Hub — tài liệu tóm tắt dành cho developer.