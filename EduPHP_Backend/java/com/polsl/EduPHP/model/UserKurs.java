package com.polsl.EduPHP.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_kurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserKurs {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUserKursu;
    
    @ManyToOne
    @JoinColumn(name = "idUser")
    @JsonManagedReference
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "idKursu")
    @JsonManagedReference
    private Kurs kurs;
    
    private Boolean ukonczony;
}