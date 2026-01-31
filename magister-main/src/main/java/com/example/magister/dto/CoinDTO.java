package com.example.magister.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CoinDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long groupId;
    private String groupName;
    private String teacherName;
    private Integer amount;
    private String reason;
    private LocalDateTime awardedDate;
}