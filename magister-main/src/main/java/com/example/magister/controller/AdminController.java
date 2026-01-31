package com.example.magister.controller;

import com.example.magister.dto.*;
import com.example.magister.entity.UserRole;
import com.example.magister.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin management endpoints")
public class AdminController {

    private final UserService userService;
    private final GroupService groupService;
    private final PaymentService paymentService;
    private final AttendanceService attendanceService;
    private final CoinService coinService;
    private final DashboardService dashboardService;

    // Dashboard
    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard")
    public ResponseEntity<AdminDashboardDTO> getDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    // User Management
    @GetMapping("/users")
    @Operation(summary = "Get all users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/users/role/{role}")
    @Operation(summary = "Get users by role")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable UserRole role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @PostMapping("/users")
    @Operation(summary = "Create new user")
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserDTO user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update user")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Deactivate user")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // Group Management
    @GetMapping("/groups")
    @Operation(summary = "Get all groups")
    public ResponseEntity<List<GroupDTO>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/groups/{id}")
    @Operation(summary = "Get group by ID")
    public ResponseEntity<GroupDTO> getGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @GetMapping("/groups/{id}/students")
    @Operation(summary = "Get students in group")
    public ResponseEntity<List<UserDTO>> getGroupStudents(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupStudents(id));
    }

    // Payment Management
    @GetMapping("/payments/pending")
    @Operation(summary = "Get pending payments")
    public ResponseEntity<List<PaymentDTO>> getPendingPayments() {
        return ResponseEntity.ok(paymentService.getPendingPayments());
    }

    @PostMapping("/payments/{id}/confirm")
    @Operation(summary = "Confirm payment")
    public ResponseEntity<PaymentDTO> confirmPayment(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long adminId) {
        return ResponseEntity.ok(paymentService.confirmPayment(id, adminId));
    }

    @GetMapping("/payments/teacher/{teacherId}")
    @Operation(summary = "Get payments by teacher")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByTeacher(@PathVariable Long teacherId) {
        return ResponseEntity.ok(paymentService.getPaymentsByTeacher(teacherId));
    }

    @GetMapping("/payments/student/{studentId}")
    @Operation(summary = "Get payments by student")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(paymentService.getPaymentsByStudent(studentId));
    }

    @GetMapping("/payments/group/{groupId}")
    @Operation(summary = "Get payments by group")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(paymentService.getPaymentsByGroup(groupId));
    }

    // Attendance Management
    @GetMapping("/attendance/group/{groupId}")
    @Operation(summary = "Get attendance by group")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceByGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByGroup(groupId));
    }

    @GetMapping("/attendance/student/{studentId}")
    @Operation(summary = "Get attendance by student")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByStudent(studentId));
    }

    // Coins Management
    @GetMapping("/coins/student/{studentId}")
    @Operation(summary = "Get coins by student")
    public ResponseEntity<List<CoinDTO>> getCoinsByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(coinService.getCoinsByStudent(studentId));
    }

    @GetMapping("/coins/group/{groupId}")
    @Operation(summary = "Get coins by group")
    public ResponseEntity<List<CoinDTO>> getCoinsByGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(coinService.getCoinsByGroup(groupId));
    }

    @GetMapping("/coins/leaderboard/{groupId}")
    @Operation(summary = "Get group leaderboard")
    public ResponseEntity<List<LeaderboardEntryDTO>> getGroupLeaderboard(@PathVariable Long groupId) {
        return ResponseEntity.ok(coinService.getGroupLeaderboard(groupId));
    }
}