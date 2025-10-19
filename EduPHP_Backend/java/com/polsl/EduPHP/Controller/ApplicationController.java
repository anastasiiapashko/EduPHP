package com.polsl.EduPHP.Controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.polsl.EduPHP.DTO.ApplicationDTO;
import com.polsl.EduPHP.model.Application;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.Service.ApplicationService;
import com.polsl.EduPHP.Service.UserService;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public List<Application> getAllApplications(){  // ← ZMIENIONE: Application zamiast ApplicationDTO
        return applicationService.getAllApplications();
    }
    
    @GetMapping("/my/{userId}") 
    public List<Application> getUserApplications(@PathVariable Integer userId){  // ← ZMIENIONE
        Optional<User> user = userService.findById(userId);
        return user.map(u -> applicationService.getUserApplications(u.getIdUser()))
                  .orElse(List.of()); 
    }
    
    @PostMapping("/{userId}")
    public ResponseEntity<Application> createApplication(@PathVariable Integer userId, @RequestBody Application application) {  // ← ZMIENIONE
        Optional<User> user = userService.findById(userId);
        
        if (user.isPresent()) {
            Application savedApplication = applicationService.createApplication(application, user.get());
            return ResponseEntity.ok(savedApplication);
        }
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> getApplicationById(@PathVariable Integer id) {  // ← ZMIENIONE
        Optional<Application> application = applicationService.getApplicationById(id);
        return application.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Application> updateApplication(@PathVariable Integer id, @RequestBody Application applicationDetails) {  // ← ZMIENIONE
        if (!applicationService.applicationExists(id)) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<Application> application = applicationService.getApplicationById(id);
        
        if (application.isPresent()) {
            Application existingApplication = application.get();
            existingApplication.setTytul(applicationDetails.getTytul());
            existingApplication.setOpis(applicationDetails.getOpis());
            
            Application updatedApplication = applicationService.updateApplication(existingApplication);
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
