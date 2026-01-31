package com.example.magister.repository;

import com.example.magister.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);

    List<Attendance> findByGroupId(Long groupId);

    List<Attendance> findByGroupIdAndLessonDateBetween(Long groupId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM Attendance a WHERE a.student.id = :studentId AND a.group.id = :groupId")
    List<Attendance> findByStudentIdAndGroupId(Long studentId, Long groupId);
}