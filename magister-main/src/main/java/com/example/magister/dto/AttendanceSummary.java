package com.example.magister.dto;

import lombok.Data;
import java.util.List;

@Data
public class AttendanceSummary {
    private Integer totalPresent;
    private Integer totalAbsent;
    private Integer totalLate;
    private Integer totalLessons;
    private Double attendanceRate;
    private List<AttendanceDTO> recentAttendance;
}