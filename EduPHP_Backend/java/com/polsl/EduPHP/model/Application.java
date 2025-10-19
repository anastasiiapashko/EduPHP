package com.polsl.EduPHP.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "application")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idApp;
    private String tytul;
    
    @Column(length = 2000)
    private String opis;
    
    private LocalDateTime datePublish;
    
    @ManyToOne
    @JoinColumn(name = "fk_user_id")  
    @JsonIgnoreProperties({"userKursy", "profil", "userApplication", "passwd"})
    private User user;
}