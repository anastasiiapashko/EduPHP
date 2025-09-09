package com.polsl.EduPHP.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.polsl.EduPHP.Repository.ProfilRepository;
import com.polsl.EduPHP.Repository.UserRepository;
import com.polsl.EduPHP.model.Profil;
import com.polsl.EduPHP.model.User;

@Service
public class UserService {

	@Autowired
	private UserRepository userRepository;
	
	@Autowired 
    private ProfilRepository profilRepository;
	
	public User zapiszRejestracje(User rejestracja) {
        // 1. Zapisz użytkownika
        User savedUser = userRepository.save(rejestracja);
        
        // 2. AUTOMATYCZNIE UTWÓRZ PROFIL DLA TEGO UŻYTKOWNIKA
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
    
	// DODANA METODA - znajdź użytkownika po ID
    public User findById(Integer userId) {
        Optional<User> user = userRepository.findById(userId);
        return user.orElse(null);
    }
    
    // DODANA METODA - znajdź użytkownika po loginie (jeśli jeszcze nie ma)
    public User findByLogin(String login) {
        Optional<User> user = userRepository.findByLogin(login);
        return user.orElse(null);
    }
    
	public Map<String, Object> sprawdzLogin(User logowanie) {
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
	
	
}
