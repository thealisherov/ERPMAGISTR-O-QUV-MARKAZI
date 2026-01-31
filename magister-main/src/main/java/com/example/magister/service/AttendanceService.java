package com.example.magister.service;

import com.example.magister.dto.AttendanceDTO;
import com.example.magister.dto.AttendanceSummary;
import com.example.magister.dto.MarkAttendanceRequest;
import com.example.magister.dto.UpdateAttendanceRequest;
// ... (I will add all imports here to be safe and clear)
import com.example.magister.entity.Attendance;
import com.example.magister.entity.AttendanceStatus;
import com.example.magister.entity.EnrollmentStatus;
import com.example.magister.entity.Group;
import com.example.magister.entity.User;
import com.example.magister.entity.UserRole;
import com.example.magister.exception.BusinessException;
import com.example.magister.exception.ResourceNotFoundException;
import com.example.magister.exception.UnauthorizedException;
import com.example.magister.repository.AttendanceRepository;
import com.example.magister.repository.GroupRepository;
import com.example.magister.repository.GroupStudentRepository;
import com.example.magister.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service

@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

        private final AttendanceRepository attendanceRepository;
        private final UserRepository userRepository;
        private final GroupRepository groupRepository;
        private final GroupStudentRepository groupStudentRepository;

        @Transactional
        public AttendanceDTO markAttendance(MarkAttendanceRequest request, Long markedById) {
                log.info("Marking attendance for student {} in group {}",
                                request.getStudentId(), request.getGroupId());

                User student = userRepository.findById(request.getStudentId())
                                .orElseThrow(() -> new ResourceNotFoundException("Student", "id",
                                                request.getStudentId()));

                Group group = groupRepository.findById(request.getGroupId())
                                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", request.getGroupId()));

                User markedBy = userRepository.findById(markedById)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", markedById));

                // Verify student is enrolled in the group
                if (!groupStudentRepository.existsByGroupIdAndStudentIdAndStatus(
                                request.getGroupId(), request.getStudentId(), EnrollmentStatus.ACTIVE)) {
                        throw new BusinessException("Student is not enrolled in this group");
                }

                // Verify marker is teacher of the group or admin
                if (markedBy.getRole() == UserRole.TEACHER &&
                                !group.getTeacher().getId().equals(markedById)) {
                        throw new UnauthorizedException("You can only mark attendance for your own groups");
                }

                Attendance attendance = Attendance.builder()
                                .student(student)
                                .group(group)
                                .markedBy(markedBy)
                                .lessonDate(request.getLessonDate())
                                .status(request.getStatus())
                                .notes(request.getNotes())
                                .createdAt(LocalDateTime.now())
                                .build();

                attendance = attendanceRepository.save(attendance);
                log.info("Attendance marked successfully");

                return mapToAttendanceDTO(attendance);
        }

        @Transactional
        public AttendanceDTO updateAttendance(Long attendanceId, UpdateAttendanceRequest request, Long userId) {
                Attendance attendance = attendanceRepository.findById(attendanceId)
                                .orElseThrow(() -> new ResourceNotFoundException("Attendance", "id", attendanceId));

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

                // Only admin or the teacher who marked it can update
                if (user.getRole() == UserRole.TEACHER &&
                                !attendance.getMarkedBy().getId().equals(userId)) {
                        throw new UnauthorizedException("You can only update attendance you marked");
                }

                if (request.getStatus() != null) {
                        attendance.setStatus(request.getStatus());
                }
                if (request.getNotes() != null) {
                        attendance.setNotes(request.getNotes());
                }

                attendance = attendanceRepository.save(attendance);
                return mapToAttendanceDTO(attendance);
        }

        @Transactional(readOnly = true)
        public List<AttendanceDTO> getAttendanceByStudent(Long studentId) {
                return attendanceRepository.findByStudentId(studentId).stream()
                                .map(this::mapToAttendanceDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<AttendanceDTO> getAttendanceByGroup(Long groupId) {
                return attendanceRepository.findByGroupId(groupId).stream()
                                .map(this::mapToAttendanceDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<AttendanceDTO> getAttendanceByGroupAndDate(Long groupId,
                        LocalDateTime startDate, LocalDateTime endDate) {
                return attendanceRepository.findByGroupIdAndLessonDateBetween(groupId, startDate, endDate)
                                .stream()
                                .map(this::mapToAttendanceDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public AttendanceSummary getAttendanceSummary(Long studentId) {
                List<Attendance> attendances = attendanceRepository.findByStudentId(studentId);

                long present = attendances.stream()
                                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
                                .count();
                long absent = attendances.stream()
                                .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                                .count();
                long late = attendances.stream()
                                .filter(a -> a.getStatus() == AttendanceStatus.LATE)
                                .count();

                AttendanceSummary summary = new AttendanceSummary();
                summary.setTotalPresent((int) present);
                summary.setTotalAbsent((int) absent);
                summary.setTotalLate((int) late);
                summary.setTotalLessons(attendances.size());

                if (attendances.size() > 0) {
                        summary.setAttendanceRate((double) present / attendances.size() * 100);
                }

                return summary;
        }

        private AttendanceDTO mapToAttendanceDTO(Attendance attendance) {
                AttendanceDTO dto = new AttendanceDTO();
                dto.setId(attendance.getId());
                dto.setStudentId(attendance.getStudent().getId());
                dto.setStudentName(attendance.getStudent().getFullName());
                dto.setGroupId(attendance.getGroup().getId());
                dto.setGroupName(attendance.getGroup().getName());
                dto.setLessonDate(attendance.getLessonDate());
                dto.setStatus(attendance.getStatus());
                dto.setNotes(attendance.getNotes());
                dto.setMarkedBy(attendance.getMarkedBy().getFullName());
                dto.setCreatedAt(attendance.getCreatedAt());
                return dto;
        }
}