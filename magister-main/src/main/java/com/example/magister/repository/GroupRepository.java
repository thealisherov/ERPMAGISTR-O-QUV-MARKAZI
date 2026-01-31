package com.example.magister.repository;

import com.example.magister.entity.Group;
import com.example.magister.entity.GroupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    List<Group> findByTeacherId(Long teacherId);

    List<Group> findByStatus(GroupStatus status);
}