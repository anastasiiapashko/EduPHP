package com.polsl.EduPHP.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idUser;
    
    private String firstName;
    private String secondName;
    
    @Column(unique = true)
    private String login;
    
    @Column(unique = true)
    @JsonIgnore // Ukryj hasło w JSON
    private String passwd;
    
    private String rola = "user";
    
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnore
    private Set<UserKurs> userKursy = new HashSet<>();
    
    @OneToOne(mappedBy = "user", orphanRemoval = true)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @JsonIgnore
    private Profil profil;
    
    @Column(name = "sandbox_user_id", unique = true)
    private Integer sandboxUserId;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnore
    private Set<UserComplain> userApplication = new HashSet<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<UserTask> userTasks = new HashSet<>();
}