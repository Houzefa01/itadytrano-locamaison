package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LandlordStatsResponse {
    private long totalViews;
    private long inquiriesCount;
    private long activeListingsCount;
    private long pendingListingsCount;
    private long totalListingsCount;
    private long pendingReservationsCount;
}
