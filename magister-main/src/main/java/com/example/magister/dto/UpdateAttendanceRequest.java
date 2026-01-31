package com.example.magister.dto;

import com.example.magister.entity.AttendanceStatus;
import lombok.Data;

@Data
public class UpdateAttendanceRequest {
      private AttendanceStatus status;
      private String notes;
}
