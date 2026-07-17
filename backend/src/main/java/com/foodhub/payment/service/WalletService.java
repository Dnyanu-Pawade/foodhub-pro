package com.foodhub.payment.service;

import com.foodhub.auth.repository.UserRepository;
import com.foodhub.common.exception.BadRequestException;
import com.foodhub.common.exception.ResourceNotFoundException;
import com.foodhub.payment.dto.WalletDto;
import com.foodhub.payment.entity.Wallet;
import com.foodhub.payment.entity.WalletTransaction;
import com.foodhub.payment.entity.WalletTransaction.TransactionType;
import com.foodhub.payment.repository.WalletRepository;
import com.foodhub.payment.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;

    public WalletDto getWallet(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(
                        new Wallet(userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found")))));

        WalletDto dto = new WalletDto();
        dto.setId(wallet.getId());
        dto.setBalance(wallet.getBalance());
        dto.setPendingCashback(wallet.getPendingCashback());
        dto.setTransactions(walletTransactionRepository
                .findByWalletIdOrderByCreatedAtDesc(wallet.getId())
                .stream().map(this::toTxDto).toList());
        return dto;
    }

    @Transactional
    public void credit(Long userId, BigDecimal amount, String description) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(
                        new Wallet(userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found")))));
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
        WalletTransaction tx = new WalletTransaction();
        tx.setWallet(wallet);
        tx.setType(TransactionType.CREDIT);
        tx.setAmount(amount);
        tx.setBalanceAfter(wallet.getBalance());
        tx.setDescription(description);
        walletTransactionRepository.save(tx);
    }

    @Transactional
    public void debit(Long userId, BigDecimal amount, Long orderId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        if (wallet.getBalance().compareTo(amount) < 0)
            throw new BadRequestException("Insufficient wallet balance");

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction();
        tx.setWallet(wallet);
        tx.setType(TransactionType.DEBIT);
        tx.setAmount(amount);
        tx.setBalanceAfter(wallet.getBalance());
        tx.setDescription("Payment for order #" + orderId);
        tx.setReferenceOrderId(orderId);
        walletTransactionRepository.save(tx);
    }

    // Runs every day at midnight — unlocks cashback older than 7 days
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void unlockPendingCashback() {
        List<WalletTransaction> pending = walletTransactionRepository.findAll().stream()
                .filter(tx -> tx.getType() == TransactionType.CASHBACK_CREDIT
                        && tx.getCreatedAt().isBefore(
                                java.time.LocalDateTime.now().minusDays(7)))
                .toList();

        for (WalletTransaction tx : pending) {
            Wallet wallet = tx.getWallet();
            BigDecimal amount = tx.getAmount();
            wallet.setBalance(wallet.getBalance().add(amount));
            wallet.setPendingCashback(wallet.getPendingCashback().subtract(amount));
            walletRepository.save(wallet);

            WalletTransaction unlock = new WalletTransaction();
            unlock.setWallet(wallet);
            unlock.setType(TransactionType.CASHBACK_UNLOCK);
            unlock.setAmount(amount);
            unlock.setBalanceAfter(wallet.getBalance());
            unlock.setDescription("Cashback unlocked from order #" + tx.getReferenceOrderId());
            unlock.setReferenceOrderId(tx.getReferenceOrderId());
            walletTransactionRepository.save(unlock);

            // Mark original tx as processed by changing type
            tx.setType(TransactionType.CASHBACK_UNLOCK);
            walletTransactionRepository.save(tx);

            log.info("Unlocked cashback ₹{} for wallet {}", amount, wallet.getId());
        }
    }

    private WalletDto.TransactionDto toTxDto(WalletTransaction tx) {
        WalletDto.TransactionDto dto = new WalletDto.TransactionDto();
        dto.setId(tx.getId());
        dto.setType(tx.getType());
        dto.setAmount(tx.getAmount());
        dto.setBalanceAfter(tx.getBalanceAfter());
        dto.setDescription(tx.getDescription());
        dto.setReferenceOrderId(tx.getReferenceOrderId());
        dto.setCreatedAt(tx.getCreatedAt());
        return dto;
    }
}
