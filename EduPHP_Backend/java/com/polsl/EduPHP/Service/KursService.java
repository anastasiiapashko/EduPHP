package com.polsl.EduPHP.Service;

import com.polsl.EduPHP.model.*;
import com.polsl.EduPHP.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class KursService {

    @Autowired
    private KursRepository kursRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserKursRepository userKursRepository;
    
    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserTaskRepository userTaskRepository;

    public List<Kurs> getAllKursy() {
        return (List<Kurs>) kursRepository.findAll();
    }
    
    public Optional<Kurs> getKursById(Integer id) {
        return kursRepository.findById(id);
    }
    
    public Kurs saveKurs(Kurs kurs) {
        // ✅ USUŃ ręczne zarządzanie ID - Hibernate sam się tym zajmie
        return kursRepository.save(kurs);
    }
    
    public void deleteKurs(Integer id) {
        Optional<Kurs> kursOpt = kursRepository.findById(id);
        if (!kursOpt.isPresent()) {
            throw new IllegalArgumentException("Kurs o ID " + id + " nie istnieje");
        }
        
        // 1. Najpierw usuń UserTask (rozwiązania zadań) - NAJNIŻSZE
        List<Task> tasks = taskRepository.findByKurs_IdKursu(id);
        for (Task task : tasks) {
            List<UserTask> userTasks = userTaskRepository.findByTask_IdTask(task.getIdTask());
            if (!userTasks.isEmpty()) {
                userTaskRepository.deleteAll(userTasks);
            }
        }
        
        // 2. Potem usuń Task (zadania)
        if (!tasks.isEmpty()) {
            taskRepository.deleteAll(tasks);
        }
        
        // 3. Potem usuń UserKurs (zapisy na kursy)
        List<UserKurs> userKursy = userKursRepository.findByKurs_IdKursu(id);
        if (!userKursy.isEmpty()) {
            userKursRepository.deleteAll(userKursy);
        }
        
        // 4. Na końcu usuń kurs
        kursRepository.deleteById(id);
    }
    
    public UserKurs addUserToKurs(Integer userId, Integer kursId, Boolean ukonczony) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Kurs> kursOpt = kursRepository.findById(kursId);
        
        if (userOpt.isPresent() && kursOpt.isPresent()) {
            Optional<UserKurs> existing = userKursRepository.findByUser_IdUserAndKurs_IdKursu(userId, kursId);
            if (existing.isPresent()) {
                UserKurs userKurs = existing.get();
                userKurs.setUkonczony(ukonczony);
                return userKursRepository.save(userKurs);
            }
            
            UserKurs userKurs = new UserKurs();
            userKurs.setUser(userOpt.get());
            userKurs.setKurs(kursOpt.get());
            userKurs.setUkonczony(ukonczony);
            
            return userKursRepository.save(userKurs);
        }
        return null;
    }
    
    public void removeUserFromKurs(Integer kursId, Integer userId) {
        Optional<UserKurs> userKurs = userKursRepository.findByUser_IdUserAndKurs_IdKursu(userId, kursId);
        userKurs.ifPresent(userKursRepository::delete);
    }
    
    public List<Kurs> getKursyByUserId(Integer userId) {
        List<UserKurs> userKursy = userKursRepository.findByUser_IdUser(userId);
        return userKursy.stream()
                .map(UserKurs::getKurs)
                .collect(Collectors.toList());
    }
    
    public Boolean isKursUkonczony(Integer userId, Integer kursId) {
        Optional<UserKurs> userKurs = userKursRepository.findByUser_IdUserAndKurs_IdKursu(userId, kursId);
        return userKurs.map(UserKurs::getUkonczony).orElse(false);
    }
    
    public Long getLiczbaUkonczonychByKurs(Integer kursId) {
        return userKursRepository.findByKurs_IdKursuAndUkonczony(kursId, true)
                .stream()
                .count();
    }
}