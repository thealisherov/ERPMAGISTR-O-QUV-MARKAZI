package com.example.magister.dto;

import lombok.Data;
import java.util.List;

@Data
public class CoinSummary {
    private Integer totalCoins;
    private List<CoinDTO> recentCoins;
}