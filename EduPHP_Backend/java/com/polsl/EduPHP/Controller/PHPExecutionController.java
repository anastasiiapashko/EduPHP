//package com.polsl.EduPHP.Controller;
//
//import com.polsl.EduPHP.Service.PHPExecutionResult;
//import com.polsl.EduPHP.Service.PHPExecutorService;
//import com.polsl.EduPHP.Service.UserTaskService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.HashMap;
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/php")
//public class PHPExecutionController {
//    
//    @Autowired
//    private PHPExecutorService phpExecutorService;
//    
//    @Autowired
//    private UserTaskService userTaskService;
//    
//    @PostMapping("/execute/{userId}/{taskId}")
//    public ResponseEntity<Map<String, Object>> executePHPCode(
//            @PathVariable Integer userId,
//            @PathVariable Integer taskId,
//            @RequestBody Map<String, String> request) {
//        
//        try {
//            String phpCode = request.get("code");
//            
//            if (phpCode == null || phpCode.trim().isEmpty()) {
//                return ResponseEntity.badRequest().body(
//                    Map.of("error", "Kod PHP nie może być pusty"));
//            }
//            
//            // 1. Wykonaj kod PHP
//            PHPExecutionResult result = phpExecutorService.executePHPCode(userId, taskId, phpCode);
//            
//            // 2. Zapisz rozwiązanie w bazie
//            userTaskService.saveSolution(userId, taskId, phpCode);
//            
//            // 3. Przygotuj odpowiedź
//            Map<String, Object> response = new HashMap<>();
//            response.put("success", result.isSuccess());
//            response.put("output", result.getOutput());
//            response.put("errors", result.getErrors());
//            response.put("filePath", result.getFilePath());
//            response.put("timestamp", System.currentTimeMillis());
//            
//            return ResponseEntity.ok(response);
//            
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError().body(
//                Map.of("error", "Błąd serwera: " + e.getMessage()));
//        }
//    }
//    
//    @PostMapping("/test/{userId}/{taskId}")
//    public ResponseEntity<Map<String, Object>> testPHPCode(
//            @PathVariable Integer userId,
//            @PathVariable Integer taskId,
//            @RequestBody Map<String, String> request) {
//        
//        try {
//            String phpCode = request.get("code");
//            
//            if (phpCode == null || phpCode.trim().isEmpty()) {
//                return ResponseEntity.badRequest().body(
//                    Map.of("error", "Kod PHP nie może być pusty"));
//            }
//            
//            // Tylko testowanie bez zapisywania
//            PHPExecutionResult result = phpExecutorService.executePHPCode(userId, taskId, phpCode);
//            
//            Map<String, Object> response = new HashMap<>();
//            response.put("success", result.isSuccess());
//            response.put("output", result.getOutput());
//            response.put("errors", result.getErrors());
//            response.put("timestamp", System.currentTimeMillis());
//            
//            return ResponseEntity.ok(response);
//            
//        } catch (Exception e) {
//            return ResponseEntity.internalServerError().body(
//                Map.of("error", "Błąd serwera: " + e.getMessage()));
//        }
//    }
//}