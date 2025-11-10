package com.polsl.EduPHP.Controller;

import com.polsl.EduPHP.Service.PHPExecutionResult;
import com.polsl.EduPHP.Service.PHPExecutorService;
import com.polsl.EduPHP.Service.UserTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/php")
public class PHPExecutionController {
    
    @Autowired
    private PHPExecutorService phpExecutorService;
    
    @Autowired
    private UserTaskService userTaskService;
   
    @PostMapping("/test/{userId}/{taskId}")
    public ResponseEntity<Map<String, Object>> testPHPCode(
            @PathVariable Integer userId,
            @PathVariable Integer taskId,
            @RequestBody Map<String, String> request) {
        
        try {
            String phpCode = request.get("code");
            
            if (phpCode == null || phpCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", "Kod PHP nie może być pusty"));
            }
            
            // DODAJ TE LINIJKI - zwiększ liczbę prób przed testowaniem
            try {
                userTaskService.incrementAttemptOnly(userId, taskId);
            } catch (Exception e) {
                // Jeśli nie ma rekordu, utwórz go
                userTaskService.startTask(userId, taskId);
                userTaskService.incrementAttemptOnly(userId, taskId);
            }
            
            // Tylko testowanie bez zapisywania
            PHPExecutionResult result = phpExecutorService.executePHPCode(userId, taskId, phpCode);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("output", result.getOutput());
            response.put("errors", result.getErrors());
            response.put("saved", false);
            response.put("message", "Kod przetestowany pomyślnie");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("success", false, "error", "Błąd serwera: " + e.getMessage()));
        }
    }
    
    @GetMapping("/solution/{userId}/{taskId}")
    public ResponseEntity<Map<String, Object>> getLastSolution(
            @PathVariable Integer userId,
            @PathVariable Integer taskId) {
        
        try {
            String solution = phpExecutorService.getLastUserSolution(userId, taskId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("code", solution);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("success", false, "error", "Błąd podczas pobierania rozwiązania: " + e.getMessage()));
        }
    }
}