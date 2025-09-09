package com.polsl.EduPHP.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.service.UserService;

@RestController
@RequestMapping("/api")
public class UserController {

	@Autowired
	private UserService userService;
	
	
	@PostMapping("/saveData")
	@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
	public User saveData(@RequestBody User rejestracja) {
		return userService.zapiszRejestracje(rejestracja);
	}
	
	@PostMapping("/checkLogin")
	@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
	public Map<String, Object> checkLogin(@RequestBody User logowanie) {
	    return userService.sprawdzLogin(logowanie); // Zwraca Mapę, nie User
	}
}
