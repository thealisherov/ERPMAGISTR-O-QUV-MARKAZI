package com.example.magister.repository;

import com.example.magister.entity.EnrollmentStatus;
import com.example.magister.entity.GroupStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupStudentRepository extends JpaRepository<GroupStudent, Long> {
    List<GroupStudent> findByStudentId(Long studentId);

    List<GroupStudent> findByGroupId(Long groupId);

    boolean existsByGroupIdAndStudentId(Long groupId, Long studentId);

    Optional<GroupStudent> findByGroupIdAndStudentId(Long groupId, Long studentId);

    boolean existsByGroupIdAndStudentIdAndStatus(Long groupId, Long studentId, EnrollmentStatus status);

    @Query("SELECT gs FROM GroupStudent gs WHERE gs.student.id = :studentId AND gs.status = :status")
    List<GroupStudent> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    List<GroupStudent> findByGroupIdAndStatus(Long groupId, EnrollmentStatus status);
}