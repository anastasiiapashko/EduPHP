package com.polsl.EduPHP.Controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.polsl.EduPHP.DTO.UserCompainDTO;
import com.polsl.EduPHP.model.UserCompain;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.Service.UserCompainService;
import com.polsl.EduPHP.Service.UserService;

@RestController
@RequestMapping("/api/applications")
public class UserCompainController {

    @Autowired
    private UserCompainService applicationService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public List<UserCompain> getAllApplications(){  // ← ZMIENIONE: Application zamiast ApplicationDTO
        return applicationService.getAllApplications();
    }
    
    @GetMapping("/my/{userId}") 
    public List<UserCompain> getUserApplications(@PathVariable Integer userId){  // ← ZMIENIONE
        Optional<User> user = userService.findById(userId);
        return user.map(u -> applicationService.getUserApplications(u.getIdUser()))
                  .orElse(List.of()); 
    }
    
    @PostMapping("/{userId}")
    public ResponseEntity<UserCompain> createApplication(@PathVariable Integer userId, @RequestBody UserCompain application) {  // ← ZMIENIONE
        Optional<User> user = userService.findById(userId);
        
        if (user.isPresent()) {
            UserCompain savedApplication = applicationService.createApplication(application, user.get());
            return ResponseEntity.ok(savedApplication);
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserCompain> getApplicationById(@PathVariable Integer id) {  // ← ZMIENIONE
        Optional<UserCompain> application = applicationService.getApplicationById(id);
        return application.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserCompain> updateApplication(@PathVariable Integer id, @RequestBody UserCompain applicationDetails) {  // ← ZMIENIONE
        if (!applicationService.applicationExists(id)) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<UserCompain> application = applicationService.getApplicationById(id);
        
        if (application.isPresent()) {
            UserCompain existingApplication = application.get();
            existingApplication.setTytul(applicationDetails.getTytul());
            existingApplication.setOpis(applicationDetails.getOpis());
            
            UserCompain updatedApplication = applicationService.updateApplication(existingApplication);
            return ResponseEntity.ok(updatedApplication);
        }
        return ResponseEntity.notFound().build();
    }

    // 🔹 Usuwa zgłoszenie
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable Integer id) {
        if (!applicationService.applicationExists(id)) {
            return ResponseEntity.notFound().build();
        }

        applicationService.deleteApplication(id);
        return ResponseEntity.ok().build();
    }

    // 🔹 Liczy wszystkie zgłoszenia
    @GetMapping("/count")
    public ResponseEntity<Long> getApplicationsCount() {
        long count = applicationService.countAllApplications();
        return ResponseEntity.ok(count);
    }
}
