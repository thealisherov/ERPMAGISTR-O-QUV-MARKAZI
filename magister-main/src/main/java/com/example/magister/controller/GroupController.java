package com.example.magister.controller;

import com.example.magister.dto.*;
import com.example.magister.service.GroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Tag(name = "Groups", description = "Group management endpoints")
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    @Operation(summary = "Create group")
    public ResponseEntity<GroupDTO> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        GroupDTO group = groupService.createGroup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(group);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update group")
    public ResponseEntity<GroupDTO> updateGroup(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGroupRequest request) {
        return ResponseEntity.ok(groupService.updateGroup(id, request));
    }

    @PostMapping("/{groupId}/enroll/{studentId}")
    @Operation(summary = "Enroll student in group")
    public ResponseEntity<Void> enrollStudent(
            @PathVariable Long groupId,
            @PathVariable Long studentId) {
        groupService.enrollStudent(groupId, studentId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{groupId}/students/{studentId}")
    @Operation(summary = "Remove student from group")
    public ResponseEntity<Void> removeStudent(
            @PathVariable Long groupId,
            @PathVariable Long studentId) {
        groupService.removeStudent(groupId, studentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "Get all groups")
    public ResponseEntity<List<GroupDTO>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get group by ID")
    public ResponseEntity<GroupDTO> getGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @GetMapping("/{id}/students")
    @Operation(summary = "Get group students")
    public ResponseEntity<List<UserDTO>> getGroupStudents(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupStudents(id));
    }
}