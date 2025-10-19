package com.polsl.EduPHP.model;



import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "kurs")
public class Kurs {

	 @Id
	 @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "kurs_seq")
	 @SequenceGenerator(name = "kurs_seq", sequenceName = "kurs_id_seq", allocationSize = 1)
	private Integer idKursu;
	private String tytul;
	
	@Column(length = 2000)
	private String tresc;
	
	private String linkWideo;
	
	@OneToMany(mappedBy = "kurs", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnore
    private Set<Task> kursTasks = new HashSet<>();
}
