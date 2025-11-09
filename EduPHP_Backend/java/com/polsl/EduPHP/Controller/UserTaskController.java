package com.polsl.EduPHP.Controller;

import com.polsl.EduPHP.DTO.UserTaskDTO;
import com.polsl.EduPHP.Service.UserTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-task")
public class UserTaskController {
    
    @Autowired
    private UserTaskService userTaskService;

    // Rozpocznij zadanie
    @PostMapping("/{userId}/start/{taskId}")
    public ResponseEntity<?> startTask(
            @PathVariable Integer userId,
            @PathVariable Integer taskId) {
        try {
            UserTaskDTO userTaskDTO = userTaskService.startTask(userId, taskId);
            return ResponseEntity.ok(userTaskDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            // Spróbuj ponownie znaleźć istniejący rekord
            try {
                UserTaskDTO existingDTO = userTaskService.getUserTaskStatusDTO(userId, taskId);
                return ResponseEntity.ok(existingDTO);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Zadanie już istnieje"));
            }
        }
    }

    // Zapisz rozwiązanie
    @PutMapping("/{userId}/task/{taskId}/solution")
    public ResponseEntity<?> saveSolution(
            @PathVariable Integer userId,
            @PathVariable Integer taskId,
            @RequestBody Map<String, String> request) {
        
        try {
            String solution = request.get("solution");
            if (solution == null || solution.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Rozwiązanie nie może być puste"));
            }
            
            UserTaskDTO userTaskDTO = userTaskService.saveSolution(userId, taskId, solution);
            return ResponseEntity.ok(userTaskDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Oznacz jako ukończone
    @PutMapping("/{userId}/task/{taskId}/complete")
    public ResponseEntity<?> completeTask(
            @PathVariable Integer userId,
            @PathVariable Integer taskId,
            @RequestBody Map<String, Integer> request) {
        
        try {
            Integer score = request.get("score");
            UserTaskDTO userTaskDTO = userTaskService.completeTask(userId, taskId, score);
            return ResponseEntity.ok(userTaskDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Pobierz status zadania - GŁÓWNY ENDPOINT który powodował problem
    @GetMapping("/{userId}/task/{taskId}")
    public ResponseEntity<?> getUserTaskStatus(
            @PathVariable Integer userId,
            @PathVariable Integer taskId) {
        
        try {
            UserTaskDTO userTaskDTO = userTaskService.getUserTaskStatusDTO(userId, taskId);
            return ResponseEntity.ok(userTaskDTO);
        } catch (IllegalArgumentException e) {
            // Jeśli nie znaleziono, zwróć domyślny DTO z statusem NOT_STARTED
            UserTaskDTO defaultDTO = new UserTaskDTO();
            defaultDTO.setUserId(userId);
            defaultDTO.setTaskId(taskId);
            defaultDTO.setStatus("NOT_STARTED");
            defaultDTO.setAttempts(0);
            defaultDTO.setScore(0);
            return ResponseEntity.ok(defaultDTO);
        }
    }

    // Pobierz wszystkie zadania użytkownika w kursie
    @GetMapping("/{userId}/course/{kursId}")
    public ResponseEntity<List<UserTaskDTO>> getUserTasksInCourse(
            @PathVariable Integer userId,
            @PathVariable Integer kursId) {
        
        List<UserTaskDTO> userTasks = userTaskService.getUserTasksInCourseDTO(userId, kursId);
        return ResponseEntity.ok(userTasks);
    }

    // Pobierz postęp w kursie
    @GetMapping("/{userId}/course/{kursId}/progress")
    public ResponseEntity<Map<String, Object>> getUserCourseProgress(
            @PathVariable Integer userId,
            @PathVariable Integer kursId) {
        
        Map<String, Object> progress = userTaskService.getUserCourseProgress(userId, kursId);
        return ResponseEntity.ok(progress);
    }

    // Pobierz wszystkie zadania użytkownika
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserTaskDTO>> getAllUserTasks(@PathVariable Integer userId) {
        List<UserTaskDTO> userTasks = userTaskService.getAllUserTasksDTO(userId);
        return ResponseEntity.ok(userTasks);
    }

    // Resetuj zadanie
    @PutMapping("/{userId}/task/{taskId}/reset")
    public ResponseEntity<?> resetTask(
            @PathVariable Integer userId,
            @PathVariable Integer taskId) {
        
        try {
            UserTaskDTO userTaskDTO = userTaskService.resetTask(userId, taskId);
            return ResponseEntity.ok(userTaskDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Statystyki użytkownika
    @GetMapping("/user/{userId}/statistics")
    public ResponseEntity<Map<String, Object>> getUserStatistics(@PathVariable Integer userId) {
        Map<String, Object> stats = userTaskService.getUserStatistics(userId);
        return ResponseEntity.ok(stats);
    }

    @RequestMapping(method = RequestMethod.OPTIONS, value = "/**")
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok().build();
    }
    
    // Użyj pomocy - oznacza zadanie jako ukończone z 0 punktów
    @PutMapping("/{userId}/task/{taskId}/use-help")
    public ResponseEntity<?> useHelpAndComplete(
            @PathVariable Integer userId,
            @PathVariable Integer taskId) {
        
        try {
            UserTaskDTO userTaskDTO = userTaskService.useHelpAndComplete(userId, taskId);
            return ResponseEntity.ok(userTaskDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}