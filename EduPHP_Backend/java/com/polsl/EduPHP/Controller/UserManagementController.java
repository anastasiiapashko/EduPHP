package com.polsl.EduPHP.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.Repository.UserRepository;
import com.polsl.EduPHP.DTO.UserManagementDTO;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@RestController
@RequestMapping("/api/admin/users")
public class UserManagementController {
    
    @Autowired
    private UserRepository userRepository;
    
    @GetMapping
    public List<UserManagementDTO> getAllUsers() {
        return StreamSupport.stream(userRepository.findAll().spliterator(), false)
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @PostMapping("/{userId}/block")
    public ResponseEntity<?> blockUser(@PathVariable Integer userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            
            if ("admin".equals(user.getRola())) {
                return ResponseEntity.badRequest().body("Cannot block administrator");
            }
            
            user.setIsActive(false);
            userRepository.save(user);
            return ResponseEntity.ok("User blocked successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error blocking user: " + e.getMessage());
        }
    }
    
    
    @PostMapping("/{userId}/unblock")
    public ResponseEntity<?> unblockUser(@PathVariable Integer userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            
            user.setIsActive(true);
            userRepository.save(user);
            return ResponseEntity.ok("User unblocked successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error unblocking user: " + e.getMessage());
        }
    }
    
    private UserManagementDTO convertToDTO(User user) {
        return new UserManagementDTO(
            user.getIdUser(),
            user.getFirstName(),
            user.getSecondName(),
            user.getLogin(),
            user.getRola(),
            user.getIsActive(),
            user.getSandboxUserId()
        );
    }
}