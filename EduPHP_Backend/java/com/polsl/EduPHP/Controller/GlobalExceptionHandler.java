package com.polsl.EduPHP.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.HashMap;
import java.util.Map;


@ControllerAdvice
public class GlobalExceptionHandler {
    

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(IllegalArgumentException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("errorType", "VALIDATION_ERROR");  // Typ błędu
        errorResponse.put("message", ex.getMessage());       // Wiadomość błędu
        return ResponseEntity.badRequest().body(errorResponse); // Zwróć kod 400
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("errorType", "DATA_ERROR");        // Błąd danych
        errorResponse.put("message", "Błąd danych - prawdopodobnie duplikat lub nieprawidłowe dane");
        return ResponseEntity.badRequest().body(errorResponse); // Zwróć kod 400
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errors);     // Zwróć kod 400 z listą błędów
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("errorType", "SERVER_ERROR");      // Błąd serwera
        errorResponse.put("message", "Wewnętrzny błąd serwera"); // Bez szczegółów dla użytkownika
        
        ex.printStackTrace();
        
        return ResponseEntity.internalServerError().body(errorResponse); // Zwróć kod 500
    }
}