package com.polsl.EduPHP.service;

import com.polsl.EduPHP.model.Profil;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.Repository.ProfilRepository;
import com.polsl.EduPHP.Repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.Map;
import java.io.IOException;

@Service
public class ProfilService {

    @Autowired
    private ProfilRepository profilRepository;

    @Autowired
    private UserRepository userRepository;

    private static final long MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final int MAX_DESCRIPTION_LENGTH = 500;

    // Tworzy nowy profil dla użytkownika
    public Profil createProfilForUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Użytkownik o ID " + userId + " nie istnieje"));

        Profil profil = new Profil();
        profil.setUser(user);
        profil.setLastLoging(LocalDateTime.now());
        profil.setOpisUser("");
        return profilRepository.save(profil);
    }

    // Znajdź profil po ID użytkownika
    public Profil getProfilByUserId(Integer userId) {
        return profilRepository.findByUserIdUser(userId);
    }

    // Zapisz zdjęcie do bazy
    public void saveAvatar(Integer userId, MultipartFile file) throws IOException {
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new IOException("Plik jest za duży. Maksymalny rozmiar: 5 MB");
        }
        if (!file.getContentType().startsWith("image/")) {
            throw new IOException("Tylko pliki obrazów są dozwolone");
        }

        Profil profil = getProfilByUserId(userId);
        if (profil == null) {
            profil = createProfilForUser(userId);
        }
        profil.setAvatar(file.getBytes());
        profil.setAvatarType(file.getContentType());
        profilRepository.save(profil);
    }

    // Usuń zdjęcie z bazy
    public void removeAvatar(Integer userId) {
        Profil profil = getProfilByUserId(userId);
        if (profil != null) {
            profil.setAvatar(null);
            profil.setAvatarType(null);
            profilRepository.save(profil);
        }
    }

    // Pobierz zdjęcie z bazy
    public byte[] getAvatar(Integer userId) {
        Profil profil = getProfilByUserId(userId);
        return (profil != null && profil.getAvatar() != null) ? profil.getAvatar() : null;
    }

    // Pobierz typ zdjęcia
    public String getAvatarType(Integer userId) {
        Profil profil = getProfilByUserId(userId);
        return (profil != null) ? profil.getAvatarType() : null;
    }

    // Aktualizacja danych osoby
    public void updatePersonalData(Integer userId, Map<String, String> personalData) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Użytkownik nie istnieje"));
        user.setFirstName(personalData.get("firstName"));
        user.setSecondName(personalData.get("secondName"));
        user.setLogin(personalData.get("login"));
        userRepository.save(user);
    }

    // Aktualizacja opisu
    public void updateDescription(Integer userId, String description) {
        if (description.length() > MAX_DESCRIPTION_LENGTH) {
            throw new IllegalArgumentException("Opis nie może przekraczać 500 znaków");
        }
        Profil profil = getProfilByUserId(userId);
        if (profil == null) {
            profil = createProfilForUser(userId);
        }
        profil.setOpisUser(description);
        profilRepository.save(profil);
    }

    // Aktualizacja hasła
 // Aktualizacja hasła - Z DEBUGOWANIEM
    public boolean updatePasswd(Integer userId, String currentPasswd, String newPasswd) {
        try {
            System.out.println("=== DEBUG UPDATE PASSWORD ===");
            System.out.println("User ID: " + userId);
            System.out.println("Current password provided: " + currentPasswd);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Użytkownik nie istnieje"));

            System.out.println("Stored password hash: " + user.getPasswd());
            
            // Sprawdź czy hasło się zgadza
            //boolean passwordMatches = BCrypt.checkpw(currentPasswd, user.getPasswd());
            boolean passwordMatches = currentPasswd.equals(user.getPasswd());
            System.out.println("Password matches: " + passwordMatches);
            
            if (!passwordMatches) {
                System.out.println("❌ Nieprawidłowe obecne hasło");
                return false;
            }

            // Zakoduj nowe hasło
            //String newPasswordHash = BCrypt.hashpw(newPasswd, BCrypt.gensalt());
            //System.out.println("New password hash: " + newPasswordHash);
            
            user.setPasswd(newPasswd);
            userRepository.save(user);
            
            System.out.println("✅ Hasło zaktualizowane pomyślnie");
            return true;
            
        } catch (Exception e) {
            System.out.println("❌ Błąd w updatePasswd: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}