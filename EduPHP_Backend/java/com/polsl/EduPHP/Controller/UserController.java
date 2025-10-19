package com.polsl.EduPHP.Controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.polsl.EduPHP.DTO.UserLogowanieDTO;
import com.polsl.EduPHP.DTO.UserRegisterDTO;
import com.polsl.EduPHP.Service.UserService;
import com.polsl.EduPHP.model.User;

@RestController
@RequestMapping("/api")
public class UserController {

	@Autowired
	private UserService userService;
	
	
	@PostMapping("/saveData")
	@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
	public ResponseEntity<?> saveData(@RequestBody UserRegisterDTO rejestracja) {
	    try {
	        User user = userService.zapiszRejestracje(rejestracja);
	        return ResponseEntity.ok(user);
	    } catch (IllegalArgumentException e) {
	        Map<String, String> errorResponse = new HashMap<>();
	        errorResponse.put("message", e.getMessage());
	        errorResponse.put("errorType", "VALIDATION_ERROR");
	        return ResponseEntity.badRequest().body(errorResponse);
	    } catch (Exception e) {
	        Map<String, String> errorResponse = new HashMap<>();
	        errorResponse.put("message", "Wewnętrzny błąd serwera");
	        errorResponse.put("errorType", "SERVER_ERROR");
	        return ResponseEntity.internalServerError().body(errorResponse);
	    }
	}

	@PostMapping("/checkLogin")
	@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
	public ResponseEntity<Map<String, Object>> checkLogin(@RequestBody UserLogowanieDTO logowanie) {
	    return ResponseEntity.ok(userService.sprawdzLogin(logowanie));
	}

	
	@DeleteMapping("/deleteUser/{userId}")
	@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
	public ResponseEntity<String> deleteUser(@PathVariable Integer userId) {
	    try {
	        userService.deleteUserWithCascade(userId);
	        return ResponseEntity.ok("Użytkownik usunięty pomyślnie");
	    } catch (Exception e) {
	        return ResponseEntity.badRequest().body("Błąd podczas usuwania: " + e.getMessage());
	    }
	}
}
