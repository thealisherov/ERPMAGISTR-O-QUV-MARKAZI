package com.example.magister.dto;

import com.example.magister.entity.GroupStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GroupDTO {
    private Long id;
    private String name;
    private String description;
    private Long teacherId;
    private String teacherName;
    private String schedule;
    private GroupStatus status;
    private Integer studentCount;
    private LocalDateTime createdAt;
}
