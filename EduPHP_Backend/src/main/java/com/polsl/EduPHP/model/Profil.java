package com.polsl.EduPHP.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "profil")
public class Profil{
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer idProf;
	
	@Lob// To mówi, że to duży obiekt (zdjęcie)
	@Column(name = "avatar", columnDefinition = "LONGBLOB")
	private byte[] avatar;
	private String avatarType;  // Jaki to typ pliku? np. "image/jpeg"
	@Column(length = 500)
	private String opisUser;
	
	private LocalDateTime lastLoging;
	
	@OneToOne
	@JoinColumn(name = "idUser", unique = true)
	private User user;
}