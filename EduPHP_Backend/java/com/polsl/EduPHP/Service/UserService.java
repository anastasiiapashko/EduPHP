package com.polsl.EduPHP.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.polsl.EduPHP.DTO.UserLogowanieDTO;
import com.polsl.EduPHP.DTO.UserRegisterDTO;
import com.polsl.EduPHP.Repository.ProfilRepository;
import com.polsl.EduPHP.Repository.UserCompainRepository;
import com.polsl.EduPHP.Repository.UserKursRepository;
import com.polsl.EduPHP.Repository.UserRepository;
import com.polsl.EduPHP.Repository.UserTaskRepository;
import com.polsl.EduPHP.model.Profil;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.model.UserCompain;
import com.polsl.EduPHP.model.UserKurs;
import com.polsl.EduPHP.model.UserTask;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

	@Autowired
	private UserRepository userRepository;
	
	@Autowired 
    private ProfilRepository profilRepository;
	
	@Autowired 
    private UserKursRepository userKursRepository;
	
	@Autowired 
	private UserTaskRepository userTaskRepository;

	@Autowired 
	private UserCompainRepository userCompainRepository;
	
	@Autowired
    private PasswordEncoder passwordEncoder;
    
    // ✅ WZORCE WALIDACYJNE
    private static final Pattern NAME_PATTERN = Pattern.compile("^[a-zA-ZąęłńóśźżĄĘŁŃÓŚŹŻ\\s.'-]{2,50}$");
    private static final Pattern LOGIN_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{3,30}$");
    private static final Pattern ROLE_PATTERN = Pattern.compile("^(user|admin)$");
    private static final int MAX_PASSWORD_LENGTH = 100;
    private static final int MAX_NAME_LENGTH = 50;
    private static final int MAX_LOGIN_LENGTH = 30;
    
    // ✅ ROZSZERZONA WALIDACJA PRZED WSZYSTKIMI ATAKAMI
    private void validateUserInput(UserRegisterDTO rejestracja) {
        if (rejestracja == null) {
            throw new IllegalArgumentException("Dane rejestracji są wymagane");
        }
        
        // Walidacja null/empty
        validateRequiredFields(rejestracja);
        
        // Oczyszczanie danych
        String firstName = sanitizeInput(rejestracja.getFirstName().trim());
        String secondName = sanitizeInput(rejestracja.getSecondName().trim());
        String login = sanitizeInput(rejestracja.getLogin().trim());
        String passwd = rejestracja.getPasswd() != null ? rejestracja.getPasswd().trim() : "";
        String rola = rejestracja.getRola() != null ? rejestracja.getRola().trim() : "user";
        
        // 1. ✅ WALIDACJA DŁUGOŚCI (Buffer Overflow protection)
        validateLengths(firstName, secondName, login, passwd);
        
        // 2. ✅ WALIDACJA FORMATU (SQL Injection, XSS, Command Injection)
        validateFormats(firstName, secondName, login, rola);
        
        // 3. ✅ WALIDACJA BEZPIECZEŃSTWA (Wzorce ataków)
        validateSecurityPatterns(firstName, secondName, login);
        
        // 4. ✅ WALIDACJA SPECJALNYCH ZNAKÓW (Null bytes, Path traversal)
        validateSpecialCharacters(firstName, secondName, login);
        
        // 5. ✅ WALIDACJA LOGIKI BIZNESOWEJ
        validateBusinessLogic(rola);
        
        // Aktualizacja oczyszczonych danych
        rejestracja.setFirstName(firstName);
        rejestracja.setSecondName(secondName);
        rejestracja.setLogin(login);
        rejestracja.setPasswd(passwd);
        rejestracja.setRola(rola);
    }
    
    private void validateRequiredFields(UserRegisterDTO rejestracja) {
        if (rejestracja.getFirstName() == null || rejestracja.getFirstName().trim().isEmpty()) {
            throw new IllegalArgumentException("Imię jest wymagane");
        }
        if (rejestracja.getSecondName() == null || rejestracja.getSecondName().trim().isEmpty()) {
            throw new IllegalArgumentException("Nazwisko jest wymagane");
        }
        if (rejestracja.getLogin() == null || rejestracja.getLogin().trim().isEmpty()) {
            throw new IllegalArgumentException("Login jest wymagany");
        }
        if (rejestracja.getPasswd() == null || rejestracja.getPasswd().trim().isEmpty()) {
            throw new IllegalArgumentException("Hasło jest wymagane");
        }
    }
    
    private void validateLengths(String firstName, String secondName, String login, String passwd) {
        if (firstName.length() < 2 || firstName.length() > MAX_NAME_LENGTH) {
            throw new IllegalArgumentException("Imię musi mieć od 2 do " + MAX_NAME_LENGTH + " znaków");
        }
        if (secondName.length() < 2 || secondName.length() > MAX_NAME_LENGTH) {
            throw new IllegalArgumentException("Nazwisko musi mieć od 2 do " + MAX_NAME_LENGTH + " znaków");
        }
        if (login.length() < 3 || login.length() > MAX_LOGIN_LENGTH) {
            throw new IllegalArgumentException("Login musi mieć od 3 do " + MAX_LOGIN_LENGTH + " znaków");
        }
        if (passwd.length() < 6 || passwd.length() > MAX_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Hasło musi mieć od 6 do " + MAX_PASSWORD_LENGTH + " znaków");
        }
    }
    
    private void validateFormats(String firstName, String secondName, String login, String rola) {
        if (!NAME_PATTERN.matcher(firstName).matches()) {
            throw new IllegalArgumentException("Imię może zawierać tylko litery, spacje, apostrofy, kropki i myślniki");
        }
        if (!NAME_PATTERN.matcher(secondName).matches()) {
            throw new IllegalArgumentException("Nazwisko może zawierać tylko litery, spacje, apostrofy, kropki i myślniki");
        }
        if (!LOGIN_PATTERN.matcher(login).matches()) {
            throw new IllegalArgumentException("Login może zawierać tylko litery, cyfry i podkreślniki");
        }
        if (!ROLE_PATTERN.matcher(rola).matches()) {
            throw new IllegalArgumentException("Rola może być tylko 'user' lub 'admin'");
        }
    }
    
    private void validateSecurityPatterns(String firstName, String secondName, String login) {
        String[] dangerousPatterns = {
            // SQL Injection
            "DROP TABLE", "DELETE FROM", "INSERT INTO", "UPDATE ", "UNION SELECT", 
            "OR '1'='1", "OR 1=1", "--", ";", "/*", "*/", "XP_CMDSHELL", "EXEC ",
            "SELECT ", "FROM ", "WHERE ", "HAVING ", "GROUP BY",
            // XSS
            "<SCRIPT", "</SCRIPT", "<IMG", "ONERROR", "ONLOAD", "ONCLICK", "ONMOUSEOVER",
            "JAVASCRIPT:", "ALERT(", "DOCUMENT.", "WINDOW.", "LOCATION.HREF", "INNERHTML",
            "<DIV", "<SPAN", "<IFRAME", "<OBJECT", "<EMBED", "<FORM", "<INPUT", "<BUTTON",
            "EVAL(", "SETTIMEOUT(", "SETINTERVAL(",
            // Command Injection
            "|", "&", "&&", "||", "`", "$(", "${", "<?", "?>", "../", "..\\",
            "RM ", "DEL ", "FORMAT ", "MKFS", "SHUTDOWN", "REBOOT",
            // NoSQL Injection
            "{\"$NE", "{\"$GT", "{\"$LT", "{\"$REGEX", "{\"$WHERE"
        };
        
        String fullData = (firstName + " " + secondName + " " + login).toUpperCase();
        
        for (String pattern : dangerousPatterns) {
            if (fullData.contains(pattern)) {
                throw new IllegalArgumentException("Wykryto niedozwolone wyrażenie: " + pattern);
            }
        }
        
        // Dodatkowa ochrona przed XSS - znaki HTML
        if (containsHtmlTags(firstName) || containsHtmlTags(secondName) || containsHtmlTags(login)) {
            throw new IllegalArgumentException("Dane zawierają niedozwolone znaczniki HTML");
        }
    }
    
    private void validateSpecialCharacters(String firstName, String secondName, String login) {
        // Null bytes i inne specjalne znaki
        if (containsNullByte(firstName) || containsNullByte(secondName) || containsNullByte(login)) {
            throw new IllegalArgumentException("Dane zawierają niedozwolone znaki specjalne");
        }
        
        // Path traversal
        if (containsPathTraversal(firstName) || containsPathTraversal(secondName) || containsPathTraversal(login)) {
            throw new IllegalArgumentException("Wykryto próbę path traversal");
        }
        
        // Unicode/long sequences
        if (containsSuspiciousUnicode(firstName) || containsSuspiciousUnicode(secondName) || containsSuspiciousUnicode(login)) {
            throw new IllegalArgumentException("Dane zawierają niedozwolone sekwencje Unicode");
        }
    }
    
    private void validateBusinessLogic(String rola) {
        // Dodatkowa logika biznesowa - np. sprawdzanie uprawnień do tworzenia adminów
        // Możesz dodać tutaj sprawdzanie czy aktualny użytkownik ma uprawnienia do tworzenia adminów
        if ("admin".equals(rola)) {
            // Tutaj możesz dodać dodatkową autoryzację
            // throw new IllegalArgumentException("Brak uprawnień do tworzenia kont administratora");
        }
    }
    
    // ✅ METODY POMOCNICZE
    private String sanitizeInput(String input) {
        if (input == null) return "";
        // Usuwanie nadmiarowych białych znaków
        return input.replaceAll("\\s+", " ");
    }
    
    private boolean containsHtmlTags(String text) {
        if (text == null) return false;
        return text.matches(".*<[^>]+>.*") || 
               text.contains("<") || text.contains(">") ||
               text.contains("&lt;") || text.contains("&gt;");
    }
    
    private boolean containsNullByte(String text) {
        return text != null && text.contains("\0");
    }
    
    private boolean containsPathTraversal(String text) {
        return text != null && (text.contains("../") || text.contains("..\\") || 
                               text.contains("/etc/") || text.contains("/bin/") ||
                               text.contains("C:\\") || text.contains("D:\\"));
    }
    
    private boolean containsSuspiciousUnicode(String text) {
        return text != null && (
            text.contains("\\u0000") || text.contains("\\x00") ||
            text.matches(".*[\\p{C}].*") || // Znaki kontrolne
            text.length() != text.codePointCount(0, text.length()) // Sprawdzanie długości Unicode
        );
    }
	
	public User zapiszRejestracje(UserRegisterDTO rejestracja) {
		// ✅ WALIDACJA BEZPIECZEŃSTWA - PIERWSZA LINIA!
		validateUserInput(rejestracja);
		
	    // ✅ WALIDACJA BIZNESOWA
	    Optional<User> existingUser = userRepository.findByLogin(rejestracja.getLogin());
	    if (existingUser.isPresent()) {
	        throw new IllegalArgumentException("Login '" + rejestracja.getLogin() + "' jest już zajęty");
	    }

	    // ✅ MAPOWANIE DTO → ENCJA Z HASHOWANIEM HASŁA
	    User user = new User();
	    user.setFirstName(rejestracja.getFirstName());
	    user.setSecondName(rejestracja.getSecondName());
	    user.setLogin(rejestracja.getLogin());
	    
	    String hashedPassword = passwordEncoder.encode(rejestracja.getPasswd());
	    user.setPasswd(hashedPassword);
	    
	    user.setRola(rejestracja.getRola());

	    // ✅ ZAPISZ USERA
	    User savedUser = userRepository.save(user);

	    // ✅ AUTOMATYCZNIE UTWÓRZ PROFIL
	    createProfileForUser(savedUser);

	    return savedUser;
	}

	// METODA DO TWORZENIA PROFILU
    private void createProfileForUser(User user) {
        Profil profil = new Profil();
        profil.setUser(user);
        profil.setLastLoging(LocalDateTime.now());
        profil.setOpisUser("");
        profil.setAvatarType(null);
        profil.setAvatar(null);
        profilRepository.save(profil);
    }
    
	// znajdź użytkownika po ID
    public Optional<User> findById(Integer userId) {
        return userRepository.findById(userId);
    }
    
    // znajdź użytkownika po loginie
    public Optional<User> findByLogin(String login) {
        return userRepository.findByLogin(login);
    }
    
public Map<String, Object> sprawdzLogin(UserLogowanieDTO logowanie) {
    Map<String, Object> response = new HashMap<>();
    
    try {
        // ✅ WALIDACJA WEJŚCIA LOGOWANIA
        if (logowanie.getLogin() == null || logowanie.getLogin().trim().isEmpty()) {
            response.put("valid", false);
            response.put("message", "Login jest wymagany");
            return response;
        }
        
        if (logowanie.getPasswd() == null || logowanie.getPasswd().trim().isEmpty()) {
            response.put("valid", false);
            response.put("message", "Hasło jest wymagane");
            return response;
        }
        
        // ✅ SANITYZACJA LOGINA
        String sanitizedLogin = sanitizeInput(logowanie.getLogin().trim());
        
        // ✅ SZUKAJ UŻYTKOWNIKA
        Optional<User> userOpt = userRepository.findByLogin(sanitizedLogin);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // ✅ WERYFIKACJA HASŁA Z HASHOWANIEM
            if (passwordEncoder.matches(logowanie.getPasswd(), user.getPasswd())) {
                
                // ✅ SPRAWDŹ CZY UŻYTKOWNIK JEST AKTYWNY - DODANE
                if (Boolean.FALSE.equals(user.getIsActive())) {
                    response.put("valid", false);
                    response.put("message", "❌ Twoje konto jest zablokowane. Skontaktuj się z administratorem.");
                    return response;
                }
                
                // ✅ AKTUALIZUJ CZAS OSTATNIEGO LOGOWANIA
                updateLastLoginTime(user.getIdUser());
                
                response.put("valid", true);
                response.put("userId", user.getIdUser());
                response.put("firstName", user.getFirstName());
                response.put("secondName", user.getSecondName());
                response.put("login", user.getLogin());
                response.put("rola", user.getRola());
                response.put("active", user.getIsActive()); 
            } else {
                response.put("valid", false);
                response.put("message", "Nieprawidłowe hasło");
            }
        } else {
            response.put("valid", false);
            response.put("message", "Użytkownik nie istnieje");
        }
        
    } catch (Exception e) {
        response.put("valid", false);
        response.put("message", "Błąd serwera: " + e.getMessage());
        e.printStackTrace();
    }
    
    return response;
}
	
	// ✅ DODAJ METODĘ DO AKTUALIZACJI CZASU LOGOWANIA
	private void updateLastLoginTime(Integer userId) {
	    try {
	        Profil profil = profilRepository.findByUserIdUser(userId);
	        if (profil != null) {
	            profil.setLastLoging(LocalDateTime.now());
	            profilRepository.save(profil);
	        } else {
	            User user = userRepository.findById(userId).orElse(null);
	            if (user != null) {
	                createProfileForUser(user);
	            }
	        }
	    } catch (Exception e) {
	        System.err.println("Błąd podczas aktualizacji czasu logowania: " + e.getMessage());
	    }
	}
	
	public void deleteUser(Integer userId) {
	    User user = userRepository.findById(userId)
	        .orElseThrow(() -> new IllegalArgumentException("User not found"));
	    
	    // 1. Usuń rozwiązania zadań
	    List<UserTask> userTasks = userTaskRepository.findByUser_IdUser(userId);
	    if (userTasks != null && !userTasks.isEmpty()) {
	        userTaskRepository.deleteAll(userTasks);
	    }
	    
	    // 2. Usuń zapisy na kursy
	    List<UserKurs> userKursy = userKursRepository.findByUser_IdUser(userId);
	    if (userKursy != null && !userKursy.isEmpty()) {
	        userKursRepository.deleteAll(userKursy);
	    } 
	    
	    // 3. Usuń zgłoszenia
	    List<UserCompain> userCompains = userCompainRepository.findByUser_IdUser(userId);
	    if (userCompains != null && !userCompains.isEmpty()) {
	        userCompainRepository.deleteAll(userCompains);
	    }
	    
	    // 4. Usuń profil
	    Profil profil = profilRepository.findByUserIdUser(userId);
	    if (profil != null) {
	        profilRepository.delete(profil);
	    }
	    
	    // 5. Na końcu usuń użytkownika
	    userRepository.delete(user);
	}
}