package com.polsl.EduPHP.Controller;

import com.polsl.EduPHP.DTO.UserTaskDTO;
import com.polsl.EduPHP.Service.UserTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-task")
public class UserTaskController {
    
    @Autowired
    private UserTaskService userTaskService;

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
            try {
                UserTaskDTO existingDTO = userTaskService.getUserTaskStatusDTO(userId, taskId);
                return ResponseEntity.ok(existingDTO);
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "Zadanie już istnieje"));
            }
        }
    }

    @PutMapping("/{userId}/task/{taskId}/save-only")
    public ResponseEntity<?> saveSolutionOnly(
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

    @PutMapping("/{userId}/task/{taskId}/complete")
    public ResponseEntity<?> completeTask(
            @PathVariable Integer userId,
            @PathVariable Integer taskId,
            @RequestBody Map<String, Object> request) {
        
        try {
            Integer timeSpentMinutes = (Integer) request.get("timeSpentMinutes");
            Integer attempts = (Integer) request.get("attempts");
            
            if(timeSpentMinutes == null || attempts == null) {
            	return ResponseEntity.badRequest().body(Map.of("error", "Czas i liczba prób są wymagane"));
            }
            
            UserTaskDTO userTaskDTO = userTaskService.completeTask(userId, taskId, timeSpentMinutes, attempts);
            return ResponseEntity.ok(userTaskDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{userId}/task/{taskId}")
    public ResponseEntity<?> getUserTaskStatus(
            @PathVariable Integer userId,
            @PathVariable Integer taskId) {
        
        try {
            UserTaskDTO userTaskDTO = userTaskService.getUserTaskStatusDTO(userId, taskId);
            return ResponseEntity.ok(userTaskDTO);
        } catch (IllegalArgumentException e) {
            UserTaskDTO defaultDTO = new UserTaskDTO();
            defaultDTO.setUserId(userId);
            defaultDTO.setTaskId(taskId);
            defaultDTO.setStatus("NOT_STARTED");
            defaultDTO.setAttempts(0);
            defaultDTO.setScore(0);
            return ResponseEntity.ok(defaultDTO);
        }
    }

    @GetMapping("/{userId}/course/{kursId}")
    public ResponseEntity<List<UserTaskDTO>> getUserTasksInCourse(
            @PathVariable Integer userId,
            @PathVariable Integer kursId) {
        
        List<UserTaskDTO> userTasks = userTaskService.getUserTasksInCourseDTO(userId, kursId);
        return ResponseEntity.ok(userTasks);
    }

    @GetMapping("/{userId}/course/{kursId}/progress")
    public ResponseEntity<Map<String, Object>> getUserCourseProgress(
            @PathVariable Integer userId,
            @PathVariable Integer kursId) {
        
        Map<String, Object> progress = userTaskService.getUserCourseProgress(userId, kursId);
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserTaskDTO>> getAllUserTasks(@PathVariable Integer userId) {
        List<UserTaskDTO> userTasks = userTaskService.getAllUserTasksDTO(userId);
        return ResponseEntity.ok(userTasks);
    }

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

    @GetMapping("/user/{userId}/statistics")
    public ResponseEntity<Map<String, Object>> getUserStatistics(@PathVariable Integer userId) {
        Map<String, Object> stats = userTaskService.getUserStatistics(userId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/user/{userId}/statistics/detailed")
    public ResponseEntity<List<UserTaskDTO>> getUserDetailedStatistics(
            @PathVariable Integer userId,
            @RequestParam(required = false) String period, // weekly, monthly, yearly
            @RequestParam(required = false) String date) { // konkretna data
        
        try {
            List<UserTaskDTO> userTasks = userTaskService.getAllUserTasksDTO(userId);
            
            if (period != null && date != null) {
                userTasks = userTaskService.filterTasksByPeriod(userTasks, period, date);
            }
            
            return ResponseEntity.ok(userTasks);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }
    
    @RequestMapping(method = RequestMethod.OPTIONS, value = "/**")
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok().build();
    }
    
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