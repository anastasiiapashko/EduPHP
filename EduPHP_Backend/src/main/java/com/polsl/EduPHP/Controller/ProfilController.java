package com.polsl.EduPHP.Controller;

import com.polsl.EduPHP.model.Profil;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.service.ProfilService;
import com.polsl.EduPHP.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/profil")
public class ProfilController {
    
    @Autowired
    private ProfilService profilService;
    
    @Autowired
    private UserService userService;
    
    // Tworzenie profilu dla użytkownika
    @PostMapping("/create/{userId}")
    @CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
    public ResponseEntity<String> createProfil(@PathVariable Integer userId) {
        try {
            // Sprawdź czy użytkownik istnieje
            User user = userService.findById(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Sprawdź czy profil już istnieje
            Profil existingProfil = profilService.getProfilByUserId(userId);
            if (existingProfil != null) {
                return ResponseEntity.badRequest().body("Profil już istnieje");
            }
            
            // Utwórz nowy profil
            Profil newProfil = profilService.createProfilForUser(userId);
            
            return ResponseEntity.ok("Profil utworzony pomyślnie");
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Błąd podczas tworzenia profilu: " + e.getMessage());
        }
    }
    
    //1. Upload zdjęcia
    @PostMapping("/upload-avatar/{userId}")
    @CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
    public ResponseEntity<String> uploadAvatar(
            @PathVariable Integer userId,
            @RequestParam("file") MultipartFile file) {
        
        try {
            // Sprawdź czy to obrazek
            if (!file.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body("Tylko zdjęcia są dozwolone!");
            }
            
            // Zapisz do bazy
            profilService.saveAvatar(userId, file);
            
            return ResponseEntity.ok("Zdjęcie zapisane! 👍");
            
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Oops! Coś poszło nie tak 😢");
        }
    }
    
    // 2. POBERZ ZDJĘCIE
    @GetMapping("/avatar/{userId}")
    @CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
    public ResponseEntity<byte[]> getAvatar(@PathVariable Integer userId) {
        byte[] avatar = profilService.getAvatar(userId);
        String avatarType = profilService.getAvatarType(userId);
        
        if (avatar != null && avatarType != null) {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(avatarType));
            headers.setContentLength(avatar.length);
            
            return new ResponseEntity<>(avatar, headers, HttpStatus.OK);
        }
        
        return ResponseEntity.notFound().build();
    }
    
    // 3. USUŃ ZDJĘCIE
    @DeleteMapping("/remove-avatar/{userId}")
    @CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
    public ResponseEntity<String> removeAvatar(@PathVariable Integer userId) {
        profilService.removeAvatar(userId);
        return ResponseEntity.ok("Zdjęcie usunięte 🗑️");
    }
    
    // 4. POKAŻ PROFIL - TU BYŁ BŁĄD!
    @GetMapping("/{userId}")
    @CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
    public ResponseEntity<Profil> getProfil(@PathVariable Integer userId) {
        Profil profil = profilService.getProfilByUserId(userId);
        if (profil != null) {
            return ResponseEntity.ok(profil);
        }
        return ResponseEntity.notFound().build();
    }
    
    //5. aktualizacja danych osoby
    @PutMapping("/update-personal/{userId}")
    @CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
    public ResponseEntity<String> updatePersonalData(
            @PathVariable Integer userId,
            @RequestBody Map<String, String> personalData) {
        
        try {
            profilService.updatePersonalData(userId, personalData);
            return ResponseEntity.ok("Dane osobowe zaktualizowane");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Błąd podczas aktualizacji danych");
        }
    }
    
    //6. aktualizacja opisu
    @PutMapping("/update-description/{userId}")
    @CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
    public ResponseEntity<String> updateDescription(
            @PathVariable Integer userId,
            @RequestParam String description) {
        
        try {
            profilService.updateDescription(userId, description);
            return ResponseEntity.ok("Opis zaktualizowany");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Błąd podczas aktualizacji opisu");
        }
    }
    
    //7. aktualizacja hasła
  //7. aktualizacja hasła - POPRAWIONE
    @PutMapping("/update-password/{userId}")
    @CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
    public ResponseEntity<String> updatePassword(
            @PathVariable Integer userId,
            @RequestBody Map<String, String> passwordData) {
        
        try {
            System.out.println("=== REQUEST DATA ===");
            System.out.println("User ID: " + userId);
            System.out.println("Current password: " + passwordData.get("currentPassword"));
            System.out.println("New password: " + passwordData.get("newPassword"));
            
            boolean success = profilService.updatePasswd(
                userId, 
                passwordData.get("currentPassword"),
                passwordData.get("newPassword")
            );
            
            if (success) {
                System.out.println("✅ Password updated successfully");
                return ResponseEntity.ok("Hasło zaktualizowane");
            } else {
                System.out.println("❌ Invalid current password");
                return ResponseEntity.badRequest().body("Nieprawidłowe obecne hasło");
            }
        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Błąd podczas zmiany hasła: " + e.getMessage());
        }
    }
    
    // DODAJ TĘ METODĘ DLA OBSŁUGI PREFLIGHT REQUESTS
    @RequestMapping(method = RequestMethod.OPTIONS, value = "/**")
    @CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok().build();
    }
}