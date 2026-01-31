package com.example.magister.service;

import com.example.magister.dto.AwardCoinsRequest;
import com.example.magister.dto.CoinDTO;
import com.example.magister.dto.CoinSummary;
import com.example.magister.dto.LeaderboardEntryDTO;
import com.example.magister.entity.Coin;
import com.example.magister.entity.EnrollmentStatus;
import com.example.magister.entity.Group;
import com.example.magister.entity.User;
import com.example.magister.exception.BusinessException;
import com.example.magister.exception.ResourceNotFoundException;
import com.example.magister.exception.UnauthorizedException;
import com.example.magister.repository.CoinRepository;
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
public class CoinService {

    private final CoinRepository coinRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;

    @Transactional
    public CoinDTO awardCoins(AwardCoinsRequest request, Long teacherId) {
        log.info("Teacher {} awarding {} coins to student {}",
                teacherId, request.getAmount(), request.getStudentId());

        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", request.getStudentId()));

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", "id", teacherId));

        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", request.getGroupId()));

        // Verify teacher owns the group
        if (!group.getTeacher().getId().equals(teacherId)) {
            throw new UnauthorizedException("You can only award coins in your own groups");
        }

        // Verify student is enrolled in the group
        if (!groupStudentRepository.existsByGroupIdAndStudentIdAndStatus(
                request.getGroupId(), request.getStudentId(), EnrollmentStatus.ACTIVE)) {
            throw new BusinessException("Student is not enrolled in this group");
        }

        if (request.getAmount() <= 0) {
            throw new BusinessException("Coin amount must be positive");
        }

        Coin coin = Coin.builder()
                .student(student)
                .teacher(teacher)
                .group(group)
                .amount(request.getAmount())
                .reason(request.getReason())
                .awardedDate(LocalDateTime.now())
                .build();

        coin = coinRepository.save(coin);
        log.info("Coins awarded successfully");

        return mapToCoinDTO(coin);
    }

    @Transactional(readOnly = true)
    public List<CoinDTO> getCoinsByStudent(Long studentId) {
        return coinRepository.findByStudentId(studentId).stream()
                .map(this::mapToCoinDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CoinDTO> getCoinsByGroup(Long groupId) {
        return coinRepository.findByGroupId(groupId).stream()
                .map(this::mapToCoinDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Integer getTotalCoinsByStudent(Long studentId) {
        Integer total = coinRepository.getTotalCoinsByStudent(studentId);
        return total != null ? total : 0;
    }

    @Transactional(readOnly = true)
    public CoinSummary getCoinSummary(Long studentId) {
        List<Coin> coins = coinRepository.findByStudentId(studentId);

        Integer totalCoins = coins.stream()
                .mapToInt(Coin::getAmount)
                .sum();

        CoinSummary summary = new CoinSummary();
        summary.setTotalCoins(totalCoins);
        summary.setRecentCoins(
                coins.stream()
                        .sorted((a, b) -> b.getAwardedDate().compareTo(a.getAwardedDate()))
                        .limit(10)
                        .map(this::mapToCoinDTO)
                        .collect(Collectors.toList()));

        return summary;
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDTO> getGroupLeaderboard(Long groupId) {
        List<Object[]> results = coinRepository.getLeaderboardByGroup(groupId);

        return results.stream()
                .map(result -> {
                    User student = (User) result[0];
                    Long total = (Long) result[1];

                    LeaderboardEntryDTO entry = new LeaderboardEntryDTO();
                    entry.setStudentId(student.getId());
                    entry.setStudentName(student.getFullName());
                    entry.setTotalCoins(total.intValue());
                    return entry;
                })
                .collect(Collectors.toList());
    }

    private CoinDTO mapToCoinDTO(Coin coin) {
        CoinDTO dto = new CoinDTO();
        dto.setId(coin.getId());
        dto.setStudentId(coin.getStudent().getId());
        dto.setStudentName(coin.getStudent().getFullName());
        dto.setGroupId(coin.getGroup().getId());
        dto.setGroupName(coin.getGroup().getName());
        dto.setTeacherName(coin.getTeacher().getFullName());
        dto.setAmount(coin.getAmount());
        dto.setReason(coin.getReason());
        dto.setAwardedDate(coin.getAwardedDate());
        return dto;
    }
}