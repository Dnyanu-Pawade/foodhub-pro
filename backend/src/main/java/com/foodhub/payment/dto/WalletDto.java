package com.foodhub.payment.dto;

import com.foodhub.payment.entity.WalletTransaction.TransactionType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class WalletDto {
    private Long id;
    private BigDecimal balance;
    private BigDecimal pendingCashback;
    private List<TransactionDto> transactions;

    @Data
    public static class TransactionDto {
        private Long id;
        private TransactionType type;
        private BigDecimal amount;
        private BigDecimal balanceAfter;
        private String description;
        private Long referenceOrderId;
        private LocalDateTime createdAt;
    }
}
