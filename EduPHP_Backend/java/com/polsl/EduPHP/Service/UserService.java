package com.polsl.EduPHP.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.polsl.EduPHP.DTO.UserLogowanieDTO;
import com.polsl.EduPHP.DTO.UserRegisterDTO;
import com.polsl.EduPHP.Repository.ProfilRepository;
import com.polsl.EduPHP.Repository.UserKursRepository;
import com.polsl.EduPHP.Repository.UserRepository;
import com.polsl.EduPHP.model.Profil;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.model.UserKurs;

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
    
	public User zapiszRejestracje(UserRegisterDTO rejestracja) {

	    // ✅ WALIDACJA
	    Optional<User> existingUser = userRepository.findByLogin(rejestracja.getLogin());
	    if (existingUser.isPresent()) {
	        throw new IllegalArgumentException("Login '" + rejestracja.getLogin() + "' jest już zajęty");
	    }
	    if (rejestracja.getLogin() == null || rejestracja.getLogin().trim().isEmpty()) {
	        throw new IllegalArgumentException("Login jest wymagany");
	    }
	    if (rejestracja.getLogin().length() < 3) {
	        throw new IllegalArgumentException("Login musi mieć co najmniej 3 znaki");
	    }
	    if (rejestracja.getPasswd() == null || rejestracja.getPasswd().trim().isEmpty()) {
	        throw new IllegalArgumentException("Hasło jest wymagane");
	    }
	    if (rejestracja.getPasswd().length() < 6) {
	        throw new IllegalArgumentException("Hasło musi mieć co najmniej 6 znaków");
	    }

	    // ✅ MAPOWANIE DTO → ENCJA
	    User user = new User();
	    user.setFirstName(rejestracja.getFirstName());
	    user.setSecondName(rejestracja.getSecondName());
	    user.setLogin(rejestracja.getLogin());
	    user.setPasswd(rejestracja.getPasswd());
	    user.setRola("user");

	    // ✅ ZAPISZ USERA
	    User savedUser = userRepository.save(user);

	    // ✅ AUTOMATYCZNIE UTWÓRZ PROFIL
	    createProfileForUser(savedUser);

	    return savedUser;
	}

	
	// METODA DO TWORZENIA PROFILU
    private void createProfileForUser(User user) {
        Profil profil = new Profil();
        profil.setUser(user); // USTAW POWIĄZANIE Z UŻYTKOWNIKIEM
        profil.setLastLoging(java.time.LocalDateTime.now()); // AKTUALNA DATA/CZAS
        profil.setOpisUser(""); // PUSTY OPIS
        profil.setAvatarType(null); // BRAK ZDJĘCIA
        profil.setAvatar(null); // BRAK ZDJĘCIA
        
        profilRepository.save(profil);
    }
    
	// znajdź użytkownika po ID
    public Optional<User> findById(Integer userId) {
        return userRepository.findById(userId);
    }
    
    // znajdź użytkownika po loginie (jeśli jeszcze nie ma)
    public Optional<User> findByLogin(String login) {
        return userRepository.findByLogin(login);
    }
    
	public Map<String, Object> sprawdzLogin(UserLogowanieDTO logowanie) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // ✅ SPRAWDŹ CZY LOGIN I HASŁO SĄ PODANE
            if (logowanie.getLogin() == null || logowanie.getLogin().isEmpty()) {
                response.put("valid", false);
                response.put("message", "Login jest wymagany");
                return response;
            }
            
            if (logowanie.getPasswd() == null || logowanie.getPasswd().isEmpty()) {
                response.put("valid", false);
                response.put("message", "Hasło jest wymagane");
                return response;
            }
            
            // ✅ SZUKAJ UŻYTKOWNIKA
            Optional<User> userOpt = userRepository.findByLogin(logowanie.getLogin());
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // ✅ PROSTE PORÓWNANIE HASŁA (na razie bez hashowania)
                if (user.getPasswd().equals(logowanie.getPasswd())) {
                	
                	// ✅ AKTUALIZUJ CZAS OSTATNIEGO LOGOWANIA W PROFILU
                    updateLastLoginTime(user.getIdUser());
                    
                    response.put("valid", true);
                    response.put("userId", user.getIdUser());
                    response.put("firstName", user.getFirstName());
                    response.put("secondName", user.getSecondName());
                    response.put("login", user.getLogin());
                    response.put("rola", user.getRola());
                } else {
                    response.put("valid", false);
                    response.put("message", "Nieprawidłowe hasło");
                }
            } else {
                response.put("valid", false);
                response.put("message", "Użytkownik nie istnieje");
            }
            
        } catch (Exception e) {
            // ✅ OBSŁUŻ BŁĘDY
            response.put("valid", false);
            response.put("message", "Błąd serwera: " + e.getMessage());
            e.printStackTrace(); // Loguj błąd w konsoli Spring Boot
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
	            // Jeśli profil nie istnieje, utwórz go
	            User user = userRepository.findById(userId).orElse(null);
	            if (user != null) {
	                createProfileForUser(user);
	            }
	        }
	    } catch (Exception e) {
	        System.err.println("Błąd podczas aktualizacji czasu logowania: " + e.getMessage());
	    }
	}
	
	public void deleteUserWithCascade(Integer userId) {
		//1. najpierw usuń zrobione kursy
		List<UserKurs> userKursy = userKursRepository.findByUser_IdUser(userId);
        if (userKursy != null && !userKursy.isEmpty()) {
        	userKursRepository.deleteAll(userKursy);
        } 
        
        // 2. usuń profil
        Profil profil = profilRepository.findByUserIdUser(userId);
        if (profil != null) {
            profilRepository.delete(profil);
        }
        
        
        // 3. Potem usuń usera
        userRepository.deleteById(userId);
    }
}
