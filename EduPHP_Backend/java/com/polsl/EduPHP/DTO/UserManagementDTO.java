package com.polsl.EduPHP.DTO;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementDTO {
    private Integer id;
    private String firstName;
    private String lastName;
    private String login;
    private String role;
    private Boolean active;
    private Integer sandboxUserId;
}