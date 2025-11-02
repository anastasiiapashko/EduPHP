package com.polsl.EduPHP.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "task")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idTask;
    
    private String tytul;
    private String description;
    private String inputs;
    private String outputs;
    private String difficulty;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idKursu")
    @JsonIgnore // Używamy JsonIgnore zamiast Managed/Back Reference
    private Kurs kurs;
    
    @OneToMany(mappedBy = "task", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<UserTask> userTasks = new HashSet<>();
}