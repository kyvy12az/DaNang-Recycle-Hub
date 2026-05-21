# Quick Integration Guide - Seller Real-Time Tracking

## 🚀 Quick Start (5 minutes)

### 1. **Add Payment Routes to Backend** (Already Done ✅)
- `backend/server.js` - Added `paymentRoutes` import & middleware

### 2. **Set Environment Variables**
```bash
# .env file
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=your_key_here
MOMO_SECRET_KEY=your_secret_here
MOMO_REDIRECT_URL=http://localhost:8081/payment/callback
MOMO_IPN_URL=http://localhost:3000/api/payment/callback
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

### 3. **Setup Socket.IO in Backend Server** (TODO)
```javascript
// backend/server.js - After Socket.IO initialization
const setupSocketEvents = require('./socketEvents');
setupSocketEvents(io, Order, User);
```

### 4. **Test Complete Flow**
1. Run backend: `cd backend && npm start`
2. Run frontend: `npm start`
3. Open app on two devices/emulators
4. Test buyer acceptance → seller notification
5. Test GPS updates (should see location change)
6. Test payment flow with Momo Sandbox

---

## 📱 User Flows

### **Buyer Flow**
```
Browse Listings
    ↓
Tap "Nhận đơn"
    ↓
Loading (2s)
    ↓
Toast: "Nhận đơn thành công"
    ↓
Navigate to Order Tracking
    ↓
GPS tracking starts (every 30s)
    ↓
Seller gets notified
    ↓
Buyer arrives at location
    ↓
Tap "Cập nhật khối lượng"
    ↓
Enter actual weight
    ↓
Price recalculated automatically
    ↓
Tap "Hoàn thành thu gom"
    ↓
Navigate to Completion Screen
    ↓
Tap "Thanh toán qua Momo"
    ↓
Momo Sandbox payment
    ↓
Success! Green points awarded
```

### **Seller Flow**
```
Listen for notifications (real-time)
    ↓
Receive: "Đơn hàng rác của bạn đã được nhận"
    ↓
Tap notification
    ↓
Navigate to Seller Order Tracking
    ↓
See buyer info (name, phone, avatar)
    ↓
Watch live map with buyer location
    ↓
See ETA updating every 30s
    ↓
Call or Chat buyer
    ↓
Wait for arrival
    ↓
Weight updated by buyer
    ↓
Buyer completes payment
    ↓
Order marked complete
```

---

## 🔧 API Endpoints

### Payment APIs
```
POST /api/payment/momo/create
- Body: { orderId, amount, buyerName, buyerPhone, description, orderInfo }
- Returns: { success, payUrl, requestId, transactionId }

GET /api/payment/momo/status/:requestId
- Returns: { success, status, resultCode, data }

POST /api/payment/momo/callback
- Receives: Momo IPN callback
- Returns: { resultCode, resultMessage }
```

### Order APIs (TODO - Create these)
```
POST /api/orders/accept
- Accept order & start tracking

POST /api/orders/:orderId/status
- Update order status

GET /api/orders/:orderId
- Get order details

POST /api/orders/:orderId/weight
- Update actual weight
```

---

## 🎯 Key Files Map

| What | Where |
|------|-------|
| Socket.IO Client | `lib/socketService.ts` |
| Socket.IO Hook | `hooks/useSocket.ts` |
| Payment Service | `lib/momoPaymentService.ts` |
| Seller Screen | `app/seller/order-tracking.tsx` |
| Payment Modal | `components/MomoPaymentModal.tsx` |
| Server Events | `backend/socketEvents.js` |
| Payment Service | `backend/services/momoService.js` |
| Payment Routes | `backend/routes/paymentRoutes.js` |

---

## 🧪 Testing Scenarios

### Test 1: Order Acceptance
1. Open app as seller (connection should show green dot)
2. Open app as buyer
3. Buyer taps "Nhận đơn"
4. Seller should receive toast/notification
5. Check browser console for Socket.IO logs

### Test 2: GPS Tracking
1. Complete Test 1
2. Check buyer screen for "GPS đang theo dõi" badge
3. Wait 30 seconds
4. Check server logs for GPS updates
5. Seller screen should show buyer location

### Test 3: Payment
1. Complete weight update
2. Tap "Thanh toán qua Momo"
3. Modal opens with correct amount
4. Tap "Thanh toán ngay"
5. Browser opens Momo sandbox
6. Complete payment in sandbox
7. App should show success after 5s

---

## 🐛 Common Issues & Fixes

### Issue: Socket.IO not connected
**Fix:**
- Check `EXPO_PUBLIC_BACKEND_URL` is correct
- Verify backend is running
- Check browser console for connection error
- Restart app

### Issue: GPS not updating
**Fix:**
- Grant location permission to app
- Check app is not in background
- Verify `expo-location` is installed
- Check server logs for GPS events

### Issue: Momo payment fails
**Fix:**
- Verify credentials in `.env`
- Check internet connection
- Try with Momo sandbox test numbers
- Check backend payment routes are registered

### Issue: Seller doesn't get notification
**Fix:**
- Both apps must be connected to Socket.IO
- Check seller is listening for `order:notification` event
- Verify buyer is emitting `order:accept` event
- Check browser dev tools Network tab

---

## 📊 Performance Tips

1. **GPS**: 30-second interval balances accuracy vs. data usage
2. **Socket.IO**: Reconnects automatically with exponential backoff
3. **Payment**: 5-second delay allows Momo to send callback
4. **Rendering**: Components use React.memo where needed

---

## 🔐 Security Notes

1. **Payment**: HMAC SHA256 signatures verify Momo authenticity
2. **Callbacks**: IPN signatures validated before processing
3. **Users**: Socket.IO auth via userId & userRole
4. **Credentials**: Never commit `.env` file

---

## 📖 Next Steps

1. **Immediate**: Set Momo credentials & test payment
2. **Short-term**: Setup GoongMap for real map display
3. **Medium-term**: Add order history & analytics
4. **Long-term**: Offline GPS queuing & backup payment methods

---

## ✅ Checklist Before Going Live

- [ ] Socket.IO connected on app startup
- [ ] Order acceptance flow works end-to-end
- [ ] GPS tracking updates every 30s
- [ ] Seller sees buyer location in real-time
- [ ] Momo payment processes successfully
- [ ] Green points awarded after payment
- [ ] Chat/call buttons work
- [ ] Error handling for all failure scenarios
- [ ] Tested on both iOS and Android
- [ ] Tested on actual devices (not just emulator)
- [ ] Momo Sandbox credentials verified
- [ ] Backend deployed and accessible
- [ ] CORS configured correctly
- [ ] Deep linking configured for Momo callback

