package com.polsl.EduPHP.DTO;

import java.time.LocalDateTime;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserCompainDTO {
    private Integer idApp;
    private String tytul;
    private String opis;
    private LocalDateTime datePublish;

    private Integer userId;
    private String userLogin;  
}
