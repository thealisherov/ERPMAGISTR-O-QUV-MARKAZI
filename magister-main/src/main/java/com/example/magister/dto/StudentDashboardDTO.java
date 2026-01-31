package com.example.magister.dto;

import lombok.Data;
import java.util.List;

@Data
public class StudentDashboardDTO {
    private List<GroupDTO> groups;
    private AttendanceSummary attendanceSummary;
    private List<PaymentDTO> recentPayments;
    private CoinSummary coinSummary;
    private Integer totalPayments;
}
