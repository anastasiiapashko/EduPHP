package com.polsl.EduPHP.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Integer idTask;
    private String tytul;
    private String description;
    private String inputs;
    private String outputs;
    private String difficulty;
    private Integer kursId; // tylko ID kursu zamiast całego obiektu
}