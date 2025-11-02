package com.polsl.EduPHP.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserTaskDTO {
    private Integer idUserTask;
    private Integer userId;
    private Integer taskId;
    private String status;
    private String userSolution;
    private LocalDateTime startDate;
    private LocalDateTime completionDate;
    private Integer attempts;
    private Integer score;
    
    // Dodatkowe pola z Task dla wygody
    private String taskTitle;
    private String taskDescription;
    private String taskDifficulty;
    private Integer kursId;
}