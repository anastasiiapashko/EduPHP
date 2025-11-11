package com.polsl.EduPHP.DTO;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AnswerDTO {
    private Integer idAnswer;
    private String content;
    private LocalDateTime dateCreated;
    private Integer userId;
    private String userLogin;
    private String userName;
    private Integer userComplainId;
}