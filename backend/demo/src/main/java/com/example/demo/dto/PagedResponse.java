package com.example.demo.dto;
 
import lombok.*;
import java.util.List;
 
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PagedResponse<T> {
    private List<T> data;
    private long total;
    private int page;
    private int pageSize;
    private int totalPages;
}
 
