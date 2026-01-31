package com.example.magister.dto;

import com.example.magister.entity.PaymentMethod;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreatePaymentRequest {
    private Long studentId;
    private Long groupId;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private PaymentMethod method;
    private String notes;
}
