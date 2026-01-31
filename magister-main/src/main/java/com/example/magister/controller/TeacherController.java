package com.example.magister.controller;

import com.example.magister.dto.*;
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
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@Tag(name = "Teacher", description = "Teacher endpoints")
public class TeacherController {

    private final GroupService groupService;
    private final AttendanceService attendanceService;
    private final PaymentService paymentService;
    private final CoinService coinService;
    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get teacher dashboard")
    public ResponseEntity<TeacherDashboardDTO> getDashboard(@RequestHeader("X-User-Id") Long teacherId) {
        return ResponseEntity.ok(dashboardService.getTeacherDashboard(teacherId));
    }

    // Groups
    @GetMapping("/groups")
    @Operation(summary = "Get my groups")
    public ResponseEntity<List<GroupDTO>> getMyGroups(@RequestHeader("X-User-Id") Long teacherId) {
        return ResponseEntity.ok(groupService.getGroupsByTeacher(teacherId));
    }

    @GetMapping("/groups/{id}")
    @Operation(summary = "Get group details")
    public ResponseEntity<GroupDTO> getGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @GetMapping("/groups/{id}/students")
    @Operation(summary = "Get students in my group")
    public ResponseEntity<List<UserDTO>> getGroupStudents(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupStudents(id));
    }

    // Attendance
    @PostMapping("/attendance")
    @Operation(summary = "Mark attendance")
    public ResponseEntity<AttendanceDTO> markAttendance(
            @Valid @RequestBody MarkAttendanceRequest request,
            @RequestHeader("X-User-Id") Long teacherId) {
        AttendanceDTO attendance = attendanceService.markAttendance(request, teacherId);
        return ResponseEntity.status(HttpStatus.CREATED).body(attendance);
    }

    @PutMapping("/attendance/{id}")
    @Operation(summary = "Update attendance")
    public ResponseEntity<AttendanceDTO> updateAttendance(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAttendanceRequest request,
            @RequestHeader("X-User-Id") Long teacherId) {
        return ResponseEntity.ok(attendanceService.updateAttendance(id, request, teacherId));
    }

    @GetMapping("/attendance/group/{groupId}")
    @Operation(summary = "Get attendance for my group")
    public ResponseEntity<List<AttendanceDTO>> getGroupAttendance(@PathVariable Long groupId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByGroup(groupId));
    }

    // Payments
    @PostMapping("/payments")
    @Operation(summary = "Record payment")
    public ResponseEntity<PaymentDTO> recordPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @RequestHeader("X-User-Id") Long teacherId) {
        PaymentDTO payment = paymentService.createPayment(request, teacherId);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    @GetMapping("/payments")
    @Operation(summary = "Get my payments")
    public ResponseEntity<List<PaymentDTO>> getMyPayments(@RequestHeader("X-User-Id") Long teacherId) {
        return ResponseEntity.ok(paymentService.getPaymentsByTeacher(teacherId));
    }

    @GetMapping("/payments/stats")
    @Operation(summary = "Get payment statistics")
    public ResponseEntity<PaymentStatsDTO> getPaymentStats(@RequestHeader("X-User-Id") Long teacherId) {
        return ResponseEntity.ok(paymentService.getPaymentStats(teacherId));
    }

    // Coins
    @PostMapping("/coins")
    @Operation(summary = "Award coins to student")
    public ResponseEntity<CoinDTO> awardCoins(
            @Valid @RequestBody AwardCoinsRequest request,
            @RequestHeader("X-User-Id") Long teacherId) {
        CoinDTO coin = coinService.awardCoins(request, teacherId);
        return ResponseEntity.status(HttpStatus.CREATED).body(coin);
    }

    @GetMapping("/coins/group/{groupId}")
    @Operation(summary = "Get coins for my group")
    public ResponseEntity<List<CoinDTO>> getGroupCoins(@PathVariable Long groupId) {
        return ResponseEntity.ok(coinService.getCoinsByGroup(groupId));
    }

    @GetMapping("/coins/leaderboard/{groupId}")
    @Operation(summary = "Get group leaderboard")
    public ResponseEntity<List<LeaderboardEntryDTO>> getGroupLeaderboard(@PathVariable Long groupId) {
        return ResponseEntity.ok(coinService.getGroupLeaderboard(groupId));
    }
}