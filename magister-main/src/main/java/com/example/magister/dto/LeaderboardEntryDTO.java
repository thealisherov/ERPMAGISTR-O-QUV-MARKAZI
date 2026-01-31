package com.example.magister.dto;

import lombok.Data;

@Data
public class LeaderboardEntryDTO {
      private Long studentId;
      private String studentName;
      private Integer totalCoins;
      private Integer rank;
      private String groupName;
}
