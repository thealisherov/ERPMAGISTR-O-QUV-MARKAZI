package com.example.magister.dto;

import com.example.magister.entity.AttendanceStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AttendanceDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long groupId;
    private String groupName;
    private LocalDateTime lessonDate;
    private AttendanceStatus status;
    private String notes;
    private String markedBy;
    private LocalDateTime createdAt;
}