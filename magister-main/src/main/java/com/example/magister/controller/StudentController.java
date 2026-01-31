package com.example.magister.controller;

import com.example.magister.dto.*;
import com.example.magister.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@Tag(name = "Student", description = "Student endpoints")
public class StudentController {

    private final GroupService groupService;
    private final AttendanceService attendanceService;
    private final PaymentService paymentService;
    private final CoinService coinService;
    private final DashboardService dashboardService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get student dashboard")
    public ResponseEntity<StudentDashboardDTO> getDashboard(@RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(dashboardService.getStudentDashboard(studentId));
    }

    @GetMapping("/groups")
    @Operation(summary = "Get my groups")
    public ResponseEntity<List<GroupDTO>> getMyGroups(@RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(groupService.getGroupsByStudent(studentId));
    }

    @GetMapping("/attendance")
    @Operation(summary = "Get my attendance")
    public ResponseEntity<List<AttendanceDTO>> getMyAttendance(@RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByStudent(studentId));
    }

    @GetMapping("/attendance/summary")
    @Operation(summary = "Get attendance summary")
    public ResponseEntity<AttendanceSummary> getAttendanceSummary(
            @RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(attendanceService.getAttendanceSummary(studentId));
    }

    @GetMapping("/payments")
    @Operation(summary = "Get my payments")
    public ResponseEntity<List<PaymentDTO>> getMyPayments(@RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(paymentService.getPaymentsByStudent(studentId));
    }

    @GetMapping("/coins")
    @Operation(summary = "Get my coins")
    public ResponseEntity<List<CoinDTO>> getMyCoins(@RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(coinService.getCoinsByStudent(studentId));
    }

    @GetMapping("/coins/summary")
    @Operation(summary = "Get coin summary")
    public ResponseEntity<CoinSummary> getCoinSummary(@RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(coinService.getCoinSummary(studentId));
    }

    @GetMapping("/coins/total")
    @Operation(summary = "Get total coins")
    public ResponseEntity<Integer> getTotalCoins(@RequestHeader("X-User-Id") Long studentId) {
        return ResponseEntity.ok(coinService.getTotalCoinsByStudent(studentId));
    }
}