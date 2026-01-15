package com.polsl.EduPHP.Service;

import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.polsl.EduPHP.Repository.UserRepository;
import com.polsl.EduPHP.model.User;

import jakarta.transaction.Transactional;

//SandboxUserService.java
@Service
@Transactional
public class SandboxUserService {
 
 @Autowired
 private UserRepository userRepository;
 
 private static final int MIN_SANDBOX_ID = 999;
 private static final int MAX_SANDBOX_ID = 99999;
 
 public Integer getOrCreateSandboxUserId(Integer mainUserId) {
     // Sprawdzenie czy już ma sandbox_id
     Optional<Integer> existingSandboxId = userRepository.findSandboxUserIdByUserId(mainUserId);
     if (existingSandboxId.isPresent() && existingSandboxId.get() != null) {
         return existingSandboxId.get();
     }
     
     // Generowanie nowego randomowego ID
     Integer newSandboxId = generateUniqueSandboxId();
     
     // Zapisanie do bazy
     User user = userRepository.findById(mainUserId)
         .orElseThrow(() -> new RuntimeException("User not found: " + mainUserId));
     user.setSandboxUserId(newSandboxId);
     userRepository.save(user);
     
     System.out.println("Przypisano sandbox_id: " + newSandboxId + " dla user: " + mainUserId);
     return newSandboxId;
 }
 
 private Integer generateUniqueSandboxId() {
     int maxAttempts = 50;
     int attempts = 0;
     
     while (attempts < maxAttempts) {
         Integer randomId = ThreadLocalRandom.current().nextInt(MIN_SANDBOX_ID, MAX_SANDBOX_ID + 1);
         
         // Sprawdzenie czy ID jest unikalne
         Optional<User> existingUser = userRepository.findBySandboxUserId(randomId);
         if (existingUser.isEmpty()) {
             return randomId;
         }
         
         attempts++;
     }
     
     throw new RuntimeException("Nie udało się wygenerować unikalnego sandbox_id po " + maxAttempts + " próbach");
 }
 
 public Optional<Integer> getSandboxUserId(Integer mainUserId) {
     return userRepository.findSandboxUserIdByUserId(mainUserId);
 }
}