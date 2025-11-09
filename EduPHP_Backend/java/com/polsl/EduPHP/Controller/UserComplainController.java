package com.polsl.EduPHP.Controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.polsl.EduPHP.DTO.UserComplainDTO;
import com.polsl.EduPHP.model.UserComplain;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.Service.UserComplainService;
import com.polsl.EduPHP.Service.UserService;

@RestController
@RequestMapping("/api/applications")
public class UserComplainController {

    @Autowired
    private UserComplainService applicationService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public List<UserComplain> getAllApplications(){  // ← ZMIENIONE: Application zamiast ApplicationDTO
        return applicationService.getAllApplications();
    }
    
    @GetMapping("/my/{userId}") 
    public List<UserComplain> getUserApplications(@PathVariable Integer userId){  // ← ZMIENIONE
        Optional<User> user = userService.findById(userId);
        return user.map(u -> applicationService.getUserApplications(u.getIdUser()))
                  .orElse(List.of()); 
    }
    
    @PostMapping("/{userId}")
    public ResponseEntity<UserComplain> createApplication(@PathVariable Integer userId, @RequestBody UserComplain application) {  // ← ZMIENIONE
        Optional<User> user = userService.findById(userId);
        
        if (user.isPresent()) {
            UserComplain savedApplication = applicationService.createApplication(application, user.get());
            return ResponseEntity.ok(savedApplication);
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserComplain> getApplicationById(@PathVariable Integer id) {  // ← ZMIENIONE
        Optional<UserComplain> application = applicationService.getApplicationById(id);
        return application.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserComplain> updateApplication(@PathVariable Integer id, @RequestBody UserComplain applicationDetails) {  // ← ZMIENIONE
        if (!applicationService.applicationExists(id)) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<UserComplain> application = applicationService.getApplicationById(id);
        
        if (application.isPresent()) {
            UserComplain existingApplication = application.get();
            existingApplication.setTytul(applicationDetails.getTytul());
            existingApplication.setOpis(applicationDetails.getOpis());
            
            UserComplain updatedApplication = applicationService.updateApplication(existingApplication);
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
