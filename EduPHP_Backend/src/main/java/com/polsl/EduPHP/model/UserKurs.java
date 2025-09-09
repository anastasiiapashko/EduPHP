package com.polsl.EduPHP.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_kurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserKurs {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUserKursu;
    
    @ManyToOne
    @JoinColumn(name = "idUser")
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "idKursu")
    private Kurs kurs;
    
    private Boolean ukonczony;
}