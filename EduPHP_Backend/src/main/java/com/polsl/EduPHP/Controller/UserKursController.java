package com.polsl.EduPHP.Controller;

import com.polsl.EduPHP.model.UserKurs;
import com.polsl.EduPHP.service.UserKursService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-kurs")
@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
public class UserKursController {
    
    @Autowired
    private UserKursService userKursService;
    
    @PostMapping("/{userId}/{kursId}")
    public ResponseEntity<String> zapiszUzytkownikaDoKursu(
            @PathVariable Integer userId,
            @PathVariable Integer kursId,
            @RequestParam(defaultValue = "false") Boolean ukonczony) {
        
        UserKurs result = userKursService.zapiszUzytkownikaDoKursu(userId, kursId, ukonczony);
        if (result != null) {
            return ResponseEntity.ok("Użytkownik zapisany do kursu");
        }
        return ResponseEntity.badRequest().body("Błąd podczas zapisywania do kursu");
    }
    
    @GetMapping("/{userId}/{kursId}/status")
    public ResponseEntity<Boolean> getStatusUkonczenia(
            @PathVariable Integer userId,
            @PathVariable Integer kursId) {
        
        Boolean status = userKursService.getStatusUkonczenia(userId, kursId);
        return ResponseEntity.ok(status);
    }
    
    @PutMapping("/{userId}/{kursId}/status")
    public ResponseEntity<String> setStatusUkonczenia(
            @PathVariable Integer userId,
            @PathVariable Integer kursId,
            @RequestParam Boolean ukonczony) {
        
        Boolean success = userKursService.setStatusUkonczenia(userId, kursId, ukonczony);
        if (success) {
            return ResponseEntity.ok("Status zaktualizowany");
        }
        return ResponseEntity.badRequest().body("Błąd podczas aktualizacji statusu");
    }
    
    @GetMapping("/{userId}/kursy")
    public ResponseEntity<List<Map<String, Object>>> getKursyUzytkownika(
            @PathVariable Integer userId,
            @RequestParam(required = false) Boolean ukonczony) {
        
        List<Map<String, Object>> kursy = userKursService.getKursyUzytkownika(userId, ukonczony)
                .stream()
                .map(k -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("idKursu", k.getIdKursu());
                    map.put("tytul", k.getTytul());
                    map.put("ukonczony", userKursService.getStatusUkonczenia(userId, k.getIdKursu()));
                    return map;
                })
                .toList();
        
        return ResponseEntity.ok(kursy);
    }
    
    @GetMapping("/{userId}/liczba-ukonczonych")
    public ResponseEntity<Long> getLiczbaUkonczonych(@PathVariable Integer userId) {
        Long liczba = userKursService.getLiczbaUkonczonychKursow(userId);
        return ResponseEntity.ok(liczba);
    }
}