package com.example.magister.dto;

import lombok.Data;
import java.util.List;

@Data
public class TeacherDashboardDTO {
      private List<GroupDTO> groups;
      private PaymentStatsDTO paymentStats;
      private List<AttendanceDTO> recentActivity;
      private Integer totalStudents;
      private Integer totalGroups;
}
