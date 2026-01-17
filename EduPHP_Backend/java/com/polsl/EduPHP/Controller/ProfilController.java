package com.polsl.EduPHP.Controller;

import com.polsl.EduPHP.DTO.ProfilDTO;
import com.polsl.EduPHP.Service.ProfilService;
import com.polsl.EduPHP.Service.UserService;
import com.polsl.EduPHP.model.Profil;
import com.polsl.EduPHP.model.User;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profil")
public class ProfilController {
    
    @Autowired
    private ProfilService profilService;
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/create/{userId}")
    public ResponseEntity<String> createProfil(@PathVariable Integer userId) {
        try {
        	Optional<User> userOpt = userService.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Profil existingProfil = profilService.getProfilByUserId(userId);
            if (existingProfil != null) {
                return ResponseEntity.badRequest().body("Profil już istnieje");
            }
            
            profilService.createProfilForUser(userId);
            
            return ResponseEntity.ok("Profil utworzony pomyślnie");
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Błąd podczas tworzenia profilu: " + e.getMessage());
        }
    }
    
    @PostMapping("/upload-avatar/{userId}")
    public ResponseEntity<String> uploadAvatar(
            @PathVariable Integer userId,
            @RequestParam("file") MultipartFile file) {
        
        try {
            if (!file.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body("Tylko zdjęcia są dozwolone!");
            }
            
            profilService.saveAvatar(userId, file);
            
            return ResponseEntity.ok("Zdjęcie zapisane! 👍");
            
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Oops! Coś poszło nie tak 😢");
        }
    }
    
    @GetMapping("/avatar/{userId}")
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
    
    @DeleteMapping("/remove-avatar/{userId}")
    public ResponseEntity<String> removeAvatar(@PathVariable Integer userId) {
        profilService.removeAvatar(userId);
        return ResponseEntity.ok("Zdjęcie usunięte 🗑️");
    }
     
    @GetMapping("/{userId}")
    public ResponseEntity<ProfilDTO> getProfil(@PathVariable Integer userId) {
        Profil profil = profilService.getProfilByUserId(userId);
        if (profil != null) {
            ProfilDTO profilDTO = profilService.convertToDTO(profil);
            return ResponseEntity.ok(profilDTO);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/update-personal/{userId}")
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
    
    @PutMapping("/update-description/{userId}")
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
    
    @PutMapping("/update-password/{userId}")
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
    
    @RequestMapping(method = RequestMethod.OPTIONS, value = "/**")
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok().build();
    }
}