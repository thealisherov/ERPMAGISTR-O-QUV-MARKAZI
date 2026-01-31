package com.example.magister.service;

import com.example.magister.dto.CreateGroupRequest;
import com.example.magister.dto.GroupDTO;
import com.example.magister.dto.UpdateGroupRequest;
import com.example.magister.dto.UserDTO;
import com.example.magister.entity.EnrollmentStatus;
import com.example.magister.entity.Group;
import com.example.magister.entity.GroupStatus;
import com.example.magister.entity.GroupStudent;
import com.example.magister.entity.User;
import com.example.magister.entity.UserRole;
import com.example.magister.exception.BusinessException;
import com.example.magister.exception.ResourceNotFoundException;
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
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupDTO createGroup(CreateGroupRequest request) {
        log.info("Creating group: {}", request.getName());

        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", "id", request.getTeacherId()));

        if (teacher.getRole() != UserRole.TEACHER) {
            throw new BusinessException("User is not a teacher");
        }

        Group group = Group.builder()
                .name(request.getName())
                .description(request.getDescription())
                .teacher(teacher)
                .schedule(request.getSchedule())
                .status(GroupStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        group = groupRepository.save(group);
        log.info("Group created: {}", group.getName());

        return mapToGroupDTO(group);
    }

    @Transactional
    public GroupDTO updateGroup(Long groupId, UpdateGroupRequest request) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }
        if (request.getSchedule() != null) {
            group.setSchedule(request.getSchedule());
        }
        if (request.getStatus() != null) {
            group.setStatus(request.getStatus());
        }

        group = groupRepository.save(group);
        return mapToGroupDTO(group);
    }

    @Transactional
    public void enrollStudent(Long groupId, Long studentId) {
        log.info("Enrolling student {} in group {}", studentId, groupId);

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        if (student.getRole() != UserRole.STUDENT) {
            throw new BusinessException("User is not a student");
        }

        if (groupStudentRepository.existsByGroupIdAndStudentId(groupId, studentId)) {
            throw new BusinessException("Student is already enrolled in this group");
        }

        GroupStudent enrollment = GroupStudent.builder()
                .group(group)
                .student(student)
                .enrolledAt(LocalDateTime.now())
                .status(EnrollmentStatus.ACTIVE)
                .build();

        groupStudentRepository.save(enrollment);
        log.info("Student enrolled successfully");
    }

    @Transactional
    public void removeStudent(Long groupId, Long studentId) {
        GroupStudent enrollment = groupStudentRepository.findByGroupIdAndStudentId(groupId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "groupId-studentId",
                        groupId + "-" + studentId));

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollment.setCompletedAt(LocalDateTime.now());
        groupStudentRepository.save(enrollment);

        log.info("Student {} removed from group {}", studentId, groupId);
    }

    @Transactional(readOnly = true)
    public List<GroupDTO> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(this::mapToGroupDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GroupDTO getGroupById(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));
        return mapToGroupDTO(group);
    }

    @Transactional(readOnly = true)
    public List<GroupDTO> getGroupsByTeacher(Long teacherId) {
        return groupRepository.findByTeacherId(teacherId).stream()
                .map(this::mapToGroupDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupDTO> getGroupsByStudent(Long studentId) {
        return groupStudentRepository.findByStudentIdAndStatus(studentId, EnrollmentStatus.ACTIVE)
                .stream()
                .map(gs -> mapToGroupDTO(gs.getGroup()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getGroupStudents(Long groupId) {
        return groupStudentRepository.findByGroupIdAndStatus(groupId, EnrollmentStatus.ACTIVE)
                .stream()
                .map(gs -> {
                    User student = gs.getStudent();
                    UserDTO dto = new UserDTO();
                    dto.setId(student.getId());
                    dto.setEmail(student.getEmail());
                    dto.setFullName(student.getFullName());
                    dto.setPhone(student.getPhone());
                    dto.setRole(student.getRole());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private GroupDTO mapToGroupDTO(Group group) {
        GroupDTO dto = new GroupDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setTeacherId(group.getTeacher().getId());
        dto.setTeacherName(group.getTeacher().getFullName());
        dto.setSchedule(group.getSchedule());
        dto.setStatus(group.getStatus());
        dto.setStudentCount((int) group.getStudents().stream()
                .filter(gs -> gs.getStatus() == EnrollmentStatus.ACTIVE)
                .count());
        dto.setCreatedAt(group.getCreatedAt());
        return dto;
    }
}