package com.polsl.EduPHP.model;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "kurs")
public class Kurs {

	@Id
	private Integer idKursu;
	private String tytul;
	
	@Column(length = 2000)
	private String tresc;
	
	private String linkWideo;
}
