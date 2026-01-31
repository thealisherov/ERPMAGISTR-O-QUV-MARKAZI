package com.example.magister.dto;

import com.example.magister.entity.AttendanceStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MarkAttendanceRequest {
    private Long studentId;
    private Long groupId;
    private LocalDateTime lessonDate;
    private AttendanceStatus status;
    private String notes;
}