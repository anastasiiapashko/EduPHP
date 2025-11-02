package com.polsl.EduPHP.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_task", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "task_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserTask {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idUserTask;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;
    
    private String status = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLETED
    
    @Column(columnDefinition = "TEXT")
    private String userSolution;
    
    private LocalDateTime startDate;
    private LocalDateTime completionDate;
    private Integer attempts = 0;//próby
    private Integer score = 0;
    
    // Automatyczne ustawienie daty przy tworzeniu
    @PrePersist
    public void prePersist() {
        if (startDate == null) {
            startDate = LocalDateTime.now();
        }
    }
}