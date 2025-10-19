package com.polsl.EduPHP.Controller;

import com.polsl.EduPHP.Service.KursService;
import com.polsl.EduPHP.model.Kurs;
import com.polsl.EduPHP.model.UserKurs;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/kurs")
@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
public class KursController {
    
    @Autowired
    private KursService kursService;
    
    @GetMapping("/all")
    public ResponseEntity<List<Kurs>> getAllKursy() {
        List<Kurs> kursy = kursService.getAllKursy();
        return ResponseEntity.ok(kursy);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Kurs> getKursById(@PathVariable Integer id) {
        Optional<Kurs> kurs = kursService.getKursById(id);
        return kurs.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/create")
    public ResponseEntity<Kurs> createKurs(@RequestBody Kurs kurs) {
        Kurs savedKurs = kursService.saveKurs(kurs);
        return ResponseEntity.ok(savedKurs);
    }
    
    @PutMapping("/update/{id}")
    public ResponseEntity<Kurs> updateKurs(@PathVariable Integer id, @RequestBody Kurs kursDetails) {
        Optional<Kurs> kursOpt = kursService.getKursById(id);
        if (kursOpt.isPresent()) {
            Kurs kurs = kursOpt.get();
            kurs.setTytul(kursDetails.getTytul());
            kurs.setTresc(kursDetails.getTresc());
            kurs.setLinkWideo(kursDetails.getLinkWideo());
            
            Kurs updatedKurs = kursService.saveKurs(kurs);
            return ResponseEntity.ok(updatedKurs);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteKurs(@PathVariable Integer id) {
        try {
            kursService.deleteKurs(id);
            return ResponseEntity.ok("Kurs usunięty pomyślnie");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Błąd serwera podczas usuwania kursu: " + e.getMessage());
        }
    }
    
    @PostMapping("/{kursId}/add-user/{userId}")
    public ResponseEntity<String> addUserToKurs(
            @PathVariable Integer kursId, 
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "false") Boolean ukonczony) {
        
        UserKurs result = kursService.addUserToKurs(userId, kursId, ukonczony);
        if (result != null) {
            return ResponseEntity.ok("Użytkownik dodany do kursu");
        }
        return ResponseEntity.badRequest().body("Błąd podczas dodawania użytkownika do kursu");
    }
    
    @DeleteMapping("/{kursId}/remove-user/{userId}")
    public ResponseEntity<String> removeUserFromKurs(@PathVariable Integer kursId, @PathVariable Integer userId) {
        kursService.removeUserFromKurs(kursId, userId);
        return ResponseEntity.ok("Użytkownik usunięty z kursu");
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Kurs>> getKursyByUser(@PathVariable Integer userId) {
        List<Kurs> kursy = kursService.getKursyByUserId(userId);
        return ResponseEntity.ok(kursy);
    }
    
    @GetMapping("/{kursId}/user/{userId}/status")
    public ResponseEntity<Boolean> getStatusUkonczenia(
            @PathVariable Integer kursId,
            @PathVariable Integer userId) {
        
        Boolean status = kursService.isKursUkonczony(userId, kursId);
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/{kursId}/liczba-ukonczonych")
    public ResponseEntity<Long> getLiczbaUkonczonych(@PathVariable Integer kursId) {
        Long liczba = kursService.getLiczbaUkonczonychByKurs(kursId);
        return ResponseEntity.ok(liczba);
    }
    
    @RequestMapping(method = RequestMethod.OPTIONS, value = "/**")
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok().build();
    }
}