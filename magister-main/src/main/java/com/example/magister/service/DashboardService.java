package com.example.magister.service;

import com.example.magister.dto.*;
import com.example.magister.entity.GroupStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final GroupService groupService;
    private final AttendanceService attendanceService;
    private final PaymentService paymentService;
    private final CoinService coinService;

    @Transactional(readOnly = true)
    public StudentDashboardDTO getStudentDashboard(Long studentId) {
        log.info("Fetching dashboard for student {}", studentId);

        StudentDashboardDTO dashboard = new StudentDashboardDTO();

        // Get enrolled groups
        dashboard.setGroups(groupService.getGroupsByStudent(studentId));

        // Get attendance summary
        dashboard.setAttendanceSummary(attendanceService.getAttendanceSummary(studentId));

        // Get recent payments
        List<PaymentDTO> allPayments = paymentService.getPaymentsByStudent(studentId);
        dashboard.setRecentPayments(
                allPayments.stream()
                        .sorted((a, b) -> b.getPaymentDate().compareTo(a.getPaymentDate()))
                        .limit(10)
                        .collect(Collectors.toList()));
        dashboard.setTotalPayments(allPayments.size());

        // Get coin summary
        dashboard.setCoinSummary(coinService.getCoinSummary(studentId));

        return dashboard;
    }

    @Transactional(readOnly = true)
    public TeacherDashboardDTO getTeacherDashboard(Long teacherId) {
        log.info("Fetching dashboard for teacher {}", teacherId);

        TeacherDashboardDTO dashboard = new TeacherDashboardDTO();

        // Get teaching groups
        List<GroupDTO> groups = groupService.getGroupsByTeacher(teacherId);
        dashboard.setGroups(groups);
        dashboard.setTotalGroups(groups.size());

        // Calculate total students across all groups
        int totalStudents = groups.stream()
                .mapToInt(GroupDTO::getStudentCount)
                .sum();
        dashboard.setTotalStudents(totalStudents);

        // Get payment statistics
        dashboard.setPaymentStats(paymentService.getPaymentStats(teacherId));

        return dashboard;
    }

    @Transactional(readOnly = true)
    public AdminDashboardDTO getAdminDashboard() {
        log.info("Fetching admin dashboard");

        AdminDashboardDTO dashboard = new AdminDashboardDTO();

        // Get all groups
        List<GroupDTO> allGroups = groupService.getAllGroups();
        dashboard.setTotalGroups(allGroups.size());
        dashboard.setActiveGroups((int) allGroups.stream()
                .filter(g -> g.getStatus() == GroupStatus.ACTIVE)
                .count());

        // Get pending payments
        List<PaymentDTO> pendingPayments = paymentService.getPendingPayments();
        dashboard.setPendingPayments(pendingPayments);
        dashboard.setPendingPaymentsCount(pendingPayments.size());

        return dashboard;
    }
}