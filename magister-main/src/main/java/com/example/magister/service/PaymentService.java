package com.example.magister.service;

import com.example.magister.dto.CreatePaymentRequest;
import com.example.magister.dto.PaymentDTO;
import com.example.magister.dto.PaymentStatsDTO;
import com.example.magister.entity.EnrollmentStatus;
import com.example.magister.entity.Group;
import com.example.magister.entity.Payment;
import com.example.magister.entity.User;
import com.example.magister.entity.UserRole;
import com.example.magister.exception.BusinessException;
import com.example.magister.exception.ResourceNotFoundException;
import com.example.magister.exception.UnauthorizedException;
import com.example.magister.repository.GroupRepository;
import com.example.magister.repository.GroupStudentRepository;
import com.example.magister.repository.PaymentRepository;
import com.example.magister.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

        private final PaymentRepository paymentRepository;
        private final UserRepository userRepository;
        private final GroupRepository groupRepository;
        private final GroupStudentRepository groupStudentRepository;

        @Transactional
        public PaymentDTO createPayment(CreatePaymentRequest request, Long teacherId) {
                log.info("Creating payment for student {} in group {}",
                                request.getStudentId(), request.getGroupId());

                User student = userRepository.findById(request.getStudentId())
                                .orElseThrow(() -> new ResourceNotFoundException("Student", "id",
                                                request.getStudentId()));

                User teacher = userRepository.findById(teacherId)
                                .orElseThrow(() -> new ResourceNotFoundException("Teacher", "id", teacherId));

                Group group = groupRepository.findById(request.getGroupId())
                                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", request.getGroupId()));

                // Verify teacher owns the group
                if (!group.getTeacher().getId().equals(teacherId)) {
                        throw new UnauthorizedException("You can only create payments for your own groups");
                }

                // Verify student is enrolled in the group
                if (!groupStudentRepository.existsByGroupIdAndStudentIdAndStatus(
                                request.getGroupId(), request.getStudentId(), EnrollmentStatus.ACTIVE)) {
                        throw new BusinessException("Student is not enrolled in this group");
                }

                Payment payment = Payment.builder()
                                .student(student)
                                .teacher(teacher)
                                .group(group)
                                .amount(request.getAmount())
                                .paymentDate(request.getPaymentDate())
                                .method(request.getMethod())
                                .notes(request.getNotes())
                                .confirmedByAdmin(false)
                                .createdAt(LocalDateTime.now())
                                .build();

                payment = paymentRepository.save(payment);
                log.info("Payment created successfully");

                return mapToPaymentDTO(payment);
        }

        @Transactional
        public PaymentDTO confirmPayment(Long paymentId, Long adminId) {
                log.info("Admin {} confirming payment {}", adminId, paymentId);

                Payment payment = paymentRepository.findById(paymentId)
                                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

                User admin = userRepository.findById(adminId)
                                .orElseThrow(() -> new ResourceNotFoundException("Admin", "id", adminId));

                if (admin.getRole() != UserRole.ADMIN) {
                        throw new UnauthorizedException("Only admins can confirm payments");
                }

                if (payment.getConfirmedByAdmin()) {
                        throw new BusinessException("Payment is already confirmed");
                }

                payment.setConfirmedByAdmin(true);
                payment.setConfirmedBy(admin);
                payment.setConfirmedAt(LocalDateTime.now());

                payment = paymentRepository.save(payment);
                log.info("Payment confirmed successfully");

                return mapToPaymentDTO(payment);
        }

        @Transactional(readOnly = true)
        public List<PaymentDTO> getPaymentsByStudent(Long studentId) {
                return paymentRepository.findByStudentId(studentId).stream()
                                .map(this::mapToPaymentDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<PaymentDTO> getPaymentsByTeacher(Long teacherId) {
                return paymentRepository.findByTeacherId(teacherId).stream()
                                .map(this::mapToPaymentDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<PaymentDTO> getPaymentsByGroup(Long groupId) {
                return paymentRepository.findByGroupId(groupId).stream()
                                .map(this::mapToPaymentDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<PaymentDTO> getPendingPayments() {
                return paymentRepository.findByConfirmedByAdmin(false).stream()
                                .map(this::mapToPaymentDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public PaymentStatsDTO getPaymentStats(Long teacherId) {
                List<Payment> payments = paymentRepository.findByTeacherId(teacherId);

                BigDecimal totalAmount = payments.stream()
                                .map(Payment::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal confirmedAmount = payments.stream()
                                .filter(Payment::getConfirmedByAdmin)
                                .map(Payment::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal pendingAmount = payments.stream()
                                .filter(p -> !p.getConfirmedByAdmin())
                                .map(Payment::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                PaymentStatsDTO stats = new PaymentStatsDTO();
                stats.setTotalPayments(payments.size());
                stats.setTotalAmount(totalAmount);
                stats.setConfirmedAmount(confirmedAmount);
                stats.setPendingAmount(pendingAmount);
                stats.setConfirmedCount((int) payments.stream()
                                .filter(Payment::getConfirmedByAdmin).count());
                stats.setPendingCount((int) payments.stream()
                                .filter(p -> !p.getConfirmedByAdmin()).count());

                return stats;
        }

        private PaymentDTO mapToPaymentDTO(Payment payment) {
                PaymentDTO dto = new PaymentDTO();
                dto.setId(payment.getId());
                dto.setStudentId(payment.getStudent().getId());
                dto.setStudentName(payment.getStudent().getFullName());
                dto.setTeacherId(payment.getTeacher().getId());
                dto.setTeacherName(payment.getTeacher().getFullName());
                dto.setGroupId(payment.getGroup().getId());
                dto.setGroupName(payment.getGroup().getName());
                dto.setAmount(payment.getAmount());
                dto.setPaymentDate(payment.getPaymentDate());
                dto.setMethod(payment.getMethod());
                dto.setConfirmedByAdmin(payment.getConfirmedByAdmin());
                dto.setNotes(payment.getNotes());
                dto.setCreatedAt(payment.getCreatedAt());
                if (payment.getConfirmedBy() != null) {
                        dto.setConfirmedBy(payment.getConfirmedBy().getFullName());
                        dto.setConfirmedAt(payment.getConfirmedAt());
                }
                return dto;
        }
}