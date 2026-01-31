package com.example.magister.repository;

import com.example.magister.entity.Coin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoinRepository extends JpaRepository<Coin, Long> {
    List<Coin> findByStudentId(Long studentId);

    List<Coin> findByGroupId(Long groupId);

    @Query("SELECT SUM(c.amount) FROM Coin c WHERE c.student.id = :studentId")
    Integer getTotalCoinsByStudent(Long studentId);

    @Query("SELECT c.student, SUM(c.amount) as total FROM Coin c WHERE c.group.id = :groupId GROUP BY c.student ORDER BY total DESC")
    List<Object[]> getLeaderboardByGroup(Long groupId);
}