package com.example.magister.dto;

import com.example.magister.entity.GroupStatus;
import lombok.Data;

@Data
public class UpdateGroupRequest {
      private String name;
      private String description;
      private String schedule;
      private GroupStatus status;
}
