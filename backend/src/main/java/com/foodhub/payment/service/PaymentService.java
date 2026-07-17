package com.foodhub.payment.service;

import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.order.entity.Order;
import com.foodhub.order.repository.OrderRepository;
import com.foodhub.payment.dto.PaymentOrderResponse;
import com.foodhub.payment.dto.PaymentVerifyRequest;
import com.foodhub.payment.entity.Payment;
import com.foodhub.payment.entity.Payment.PaymentStatus;
import com.foodhub.payment.entity.Wallet;
import com.foodhub.payment.entity.WalletTransaction;
import com.foodhub.payment.entity.WalletTransaction.TransactionType;
import com.foodhub.payment.repository.PaymentRepository;
import com.foodhub.payment.repository.WalletRepository;
import com.foodhub.payment.repository.WalletTransactionRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Value("${razorpay.key-id}")     private String keyId;
    @Value("${razorpay.key-secret}") private String keySecret;

    private boolean isSimulateMode() {
        return "your_key_id".equals(keyId);
    }

    private RazorpayClient getRazorpayClient() throws RazorpayException {
        return new RazorpayClient(keyId, keySecret);
    }

    @Transactional
    public PaymentOrderResponse createRazorpayOrder(Long orderId) throws RazorpayException {
        paymentRepository.findByOrderId(orderId).ifPresent(p -> {
            if (p.getStatus() == PaymentStatus.SUCCESS)
                throw new BadRequestException("Order already paid");
        });

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Payment payment = paymentRepository.findByOrderId(orderId).orElse(new Payment());
        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(PaymentStatus.PENDING);

        PaymentOrderResponse response = new PaymentOrderResponse();
        response.setAmount(order.getTotalAmount());
        response.setCurrency("INR");

        if (isSimulateMode()) {
            String fakeOrderId = "sim_order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            payment.setRazorpayOrderId(fakeOrderId);
            paymentRepository.save(payment);
            response.setRazorpayOrderId(fakeOrderId);
            response.setKeyId("simulate");
            log.info("[SIMULATE] Payment order created for orderId={} amount={}", orderId, order.getTotalAmount());
        } else {
            JSONObject options = new JSONObject();
            options.put("amount", order.getTotalAmount().multiply(BigDecimal.valueOf(100)).intValue());
            options.put("currency", "INR");
            options.put("receipt", "order_" + orderId);
            com.razorpay.Order rzpOrder = getRazorpayClient().orders.create(options);
            payment.setRazorpayOrderId(rzpOrder.get("id"));
            paymentRepository.save(payment);
            response.setRazorpayOrderId(rzpOrder.get("id"));
            response.setKeyId(keyId);
        }
        return response;
    }

    @Transactional
    public void verifyAndCapture(PaymentVerifyRequest request) {
        if (isSimulateMode()) {
            // In simulate mode accept any payment
            Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment record not found"));
            payment.setRazorpayPaymentId(request.getRazorpayPaymentId() != null ? request.getRazorpayPaymentId() : "sim_pay_" + UUID.randomUUID().toString().substring(0, 14));
            payment.setStatus(PaymentStatus.SUCCESS);
            paymentRepository.save(payment);
            Order order = payment.getOrder();
            order.setPaymentStatus("PAID");
            orderRepository.save(order);
            creditCashback(order.getCustomer().getId(), payment.getAmount(), order.getId());
            log.info("[SIMULATE] Payment verified for orderId={}", order.getId());
            return;
        }

        String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
        if (!verifySignature(payload, request.getRazorpaySignature()))
            throw new BadRequestException("Payment signature verification failed");

        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found"));
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setPaymentStatus("PAID");
        orderRepository.save(order);
        creditCashback(order.getCustomer().getId(), payment.getAmount(), order.getId());
    }

    @Transactional
    public PaymentOrderResponse createWalletTopupOrder(Long userId, double amount) throws RazorpayException {
        Payment payment = new Payment();
        payment.setAmount(java.math.BigDecimal.valueOf(amount));
        payment.setStatus(PaymentStatus.PENDING);

        PaymentOrderResponse response = new PaymentOrderResponse();
        response.setAmount(java.math.BigDecimal.valueOf(amount));
        response.setCurrency("INR");

        if (isSimulateMode()) {
            String fakeOrderId = "sim_wallet_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            payment.setRazorpayOrderId(fakeOrderId);
            paymentRepository.save(payment);
            response.setRazorpayOrderId(fakeOrderId);
            response.setKeyId("simulate");
            log.info("[SIMULATE] Wallet topup order created userId={} amount={}", userId, amount);
        } else {
            JSONObject options = new JSONObject();
            options.put("amount", (int)(amount * 100));
            options.put("currency", "INR");
            options.put("receipt", "wallet_" + userId + "_" + System.currentTimeMillis());
            com.razorpay.Order rzpOrder = getRazorpayClient().orders.create(options);
            payment.setRazorpayOrderId(rzpOrder.get("id"));
            paymentRepository.save(payment);
            response.setRazorpayOrderId(rzpOrder.get("id"));
            response.setKeyId(keyId);
        }
        return response;
    }

    @Transactional
    public void verifyAndCreditWallet(PaymentVerifyRequest request, Long userId) {
        if (!isSimulateMode()) {
            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            if (!verifySignature(payload, request.getRazorpaySignature()))
                throw new BadRequestException("Payment signature verification failed");
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found"));
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId() != null ? request.getRazorpayPaymentId() : "sim_pay_" + UUID.randomUUID().toString().substring(0, 14));
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        Wallet wallet = walletRepository.findByUserId(userId).orElseThrow(
                () -> new ResourceNotFoundException("Wallet not found"));
        wallet.setBalance(wallet.getBalance().add(payment.getAmount()));
        walletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction();
        tx.setWallet(wallet);
        tx.setType(TransactionType.CREDIT);
        tx.setAmount(payment.getAmount());
        tx.setBalanceAfter(wallet.getBalance());
        tx.setDescription("Wallet top-up" + (isSimulateMode() ? " (simulated)" : " via Razorpay"));
        walletTransactionRepository.save(tx);
    }

    private void creditCashback(Long userId, BigDecimal orderAmount, Long orderId) {
        BigDecimal cashback = orderAmount
                .multiply(BigDecimal.valueOf(0.02))
                .setScale(2, RoundingMode.HALF_UP);

        Order order = orderRepository.findById(orderId).orElseThrow();
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(new Wallet(order.getCustomer())));

        wallet.setPendingCashback(wallet.getPendingCashback().add(cashback));
        walletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction();
        tx.setWallet(wallet);
        tx.setType(TransactionType.CASHBACK_CREDIT);
        tx.setAmount(cashback);
        tx.setBalanceAfter(wallet.getBalance());
        tx.setDescription("2% cashback on order #" + orderId + " (unlocks in 7 days)");
        tx.setReferenceOrderId(orderId);
        walletTransactionRepository.save(tx);
    }

    private boolean verifySignature(String payload, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash).equals(signature);
        } catch (Exception e) {
            log.error("Signature verification error", e);
            return false;
        }
    }
}
