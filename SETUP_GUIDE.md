# Hướng dẫn nhanh: Thiết lập xác thực cục bộ

## Tổng quan

Dự án hiện dùng xác thực cục bộ bằng AsyncStorage trong contexts/AuthContext.tsx.

- Đăng ký: lưu tài khoản vào bộ nhớ cục bộ của thiết bị.
- Đăng nhập: đối chiếu email và mật khẩu với dữ liệu đã lưu.
- Đăng xuất: xóa phiên đăng nhập hiện tại.
- Đăng nhập mạng xã hội: chưa hỗ trợ.

## Chạy dự án

```bash
npm install
npx expo start
```

## Reset dữ liệu đăng nhập cục bộ

Nếu muốn test lại từ đầu, gỡ app trên thiết bị/emulator hoặc xóa AsyncStorage của ứng dụng.

## File quan trọng

- contexts/AuthContext.tsx: logic xác thực.
- app/login.tsx: màn hình đăng nhập.
- app/register.tsx: màn hình đăng ký.
- app/_layout.tsx: điều hướng theo trạng thái đăng nhập.
