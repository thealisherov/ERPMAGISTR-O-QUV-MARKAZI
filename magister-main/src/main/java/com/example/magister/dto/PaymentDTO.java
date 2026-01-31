package com.example.magister.dto;

import com.example.magister.entity.PaymentMethod;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long teacherId;
    private String teacherName;
    private Long groupId;
    private String groupName;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private PaymentMethod method;
    private Boolean confirmedByAdmin;
    private String notes;
    private LocalDateTime createdAt;
    private String confirmedBy;
    private LocalDateTime confirmedAt;
}
