package com.polsl.EduPHP.DTO;
import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class UserRegisterDTO {
    
    @NotBlank(message = "Imię jest wymagane")
    @Size(min = 2, max = 50, message = "Imię musi mieć 2-50 znaków")
    @Pattern(regexp = "^[a-zA-ZąęłńóśźżĄĘŁŃÓŚŹŻ\\s.-]+$", message = "Imię może zawierać tylko litery, spacje, kropki i myślniki")
    private String firstName;
    
    @NotBlank(message = "Nazwisko jest wymagane")
    @Size(min = 2, max = 50, message = "Nazwisko musi mieć 2-50 znaków")
    @Pattern(regexp = "^[a-zA-ZąęłńóśźżĄĘŁŃÓŚŹŻ\\s.-]+$", message = "Nazwisko może zawierać tylko litery, spacje, kropki i myślniki")
    private String secondName;
    
    @NotBlank(message = "Login jest wymagany")
    @Size(min = 3, max = 30, message = "Login musi mieć 3-30 znaków")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Login może zawierać tylko litery, cyfry i podkreślniki")
    private String login;
    
    @NotBlank(message = "Hasło jest wymagane")
    @Size(min = 6, message = "Hasło musi mieć co najmniej 6 znaków")
    private String passwd;
    
    @Pattern(regexp = "^(user|admin)$", message = "Rola może być tylko 'user' lub 'admin'")
    private String rola = "user";
}