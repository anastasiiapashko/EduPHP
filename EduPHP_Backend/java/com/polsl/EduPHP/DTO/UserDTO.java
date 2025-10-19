package com.polsl.EduPHP.DTO;

import lombok.Data;

//Dodaj klasę UserDTO:
@Data
class UserDTO {
 private Integer idUser;
 private String firstName;
 private String secondName;
 private String login;
 // pomijamy pola: passwd, userKursy, profil, userApplication
}
