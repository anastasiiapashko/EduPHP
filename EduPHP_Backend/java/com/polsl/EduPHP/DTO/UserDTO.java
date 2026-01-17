package com.polsl.EduPHP.DTO;

import lombok.Data;

@Data
class UserDTO {
 private Integer idUser;
 private String firstName;
 private String secondName;
 private String login;
 // pomijane pola: passwd, userKursy, profil, userApplication
}
