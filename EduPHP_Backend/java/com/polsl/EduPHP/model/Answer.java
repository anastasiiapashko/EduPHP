package com.polsl.EduPHP.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "answer")
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idAnswer;
    
    @Column(length = 2000)
    private String content;
    
    private LocalDateTime dateCreated;
    
    @ManyToOne
    @JoinColumn(name = "fk_user_id")
    @JsonIgnoreProperties({"userKursy", "profil", "userApplication", "passwd", "userTasks"})
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "fk_user_complain_id")
    @JsonIgnoreProperties({"user"})
    private UserComplain userComplain;
}