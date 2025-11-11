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
import java.util.stream.StreamSupport;

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
        return StreamSupport.stream(kursRepository.findAll().spliterator(), false)
                           .collect(Collectors.toList());
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

    public Double getProgressUkonczenia(Integer userId, Integer kursId) {
        try {
            System.out.println("=== DEBUG: getProgressUkonczenia ===");
            System.out.println("userId: " + userId + ", kursId: " + kursId);
            
            // Pobierz wszystkie zadania dla tego kursu
            List<Task> tasksInCourse = taskRepository.findByKurs_IdKursu(kursId);
            System.out.println("Znaleziono zadań w kursie: " + tasksInCourse.size());
            
            if (tasksInCourse.isEmpty()) {
                System.out.println("Brak zadań - zwracam 0.0");
                return 0.0;
            }
            
            // Pobierz zadania użytkownika dla tego kursu
            List<UserTask> userTasks = userTaskRepository.findByUser_IdUserAndTask_Kurs_IdKursu(userId, kursId);
            System.out.println("Znaleziono userTasks: " + userTasks.size());
            
            // ✅ DODAJ: Debugowanie statusów
            userTasks.forEach(ut -> {
                System.out.println("Zadanie " + ut.getTask().getIdTask() + " - status: '" + ut.getStatus() + "'");
            });
            
            // Policz ukończone zadania - SPRAWDŹ CZY STATUS JEST "COMPLETED"
            long completedTasks = userTasks.stream()
                .filter(ut -> "COMPLETED".equalsIgnoreCase(ut.getStatus()))
                .count();
            
            System.out.println("Ukończone zadania: " + completedTasks + "/" + tasksInCourse.size());
            
            // Oblicz procent
            double progress = (double) completedTasks / tasksInCourse.size() * 100;
            System.out.println("Obliczony progres: " + progress + "%");
            
            return progress;
            
        } catch (Exception e) {
            System.err.println("!!! BŁĄD W getProgressUkonczenia !!!");
            System.err.println("userId: " + userId + ", kursId: " + kursId);
            e.printStackTrace();
            return 0.0;
        }
    }
    
    public Double getOverallProgress(Integer userId) {
        try {
            System.out.println("=== DEBUG: getOverallProgress ===");
            System.out.println("userId: " + userId);
            
            // Pobierz wszystkie kursy użytkownika
            List<Kurs> userCourses = getKursyByUserId(userId);
            System.out.println("Znaleziono kursów użytkownika: " + userCourses.size());
            
            if (userCourses.isEmpty()) {
                System.out.println("Brak kursów - zwracam 0.0");
                return 0.0;
            }
            
            double totalProgress = 0.0;
            int coursesWithTasks = 0;
            
            // Dla każdego kursu oblicz progres
            for (Kurs kurs : userCourses) {
                Double courseProgress = getProgressUkonczenia(userId, kurs.getIdKursu());
                totalProgress += courseProgress;
                coursesWithTasks++;
            }
            
            // Oblicz średni progres
            double overallProgress = coursesWithTasks > 0 ? totalProgress / coursesWithTasks : 0.0;
            System.out.println("Ogólny progres: " + overallProgress + "%");
            
            return overallProgress;
            
        } catch (Exception e) {
            System.err.println("!!! BŁĄD W getOverallProgress !!!");
            System.err.println("userId: " + userId);
            e.printStackTrace();
            return 0.0;
        }
    }

    public Long getCompletedCoursesCount(Integer userId) {
        try {
            System.out.println("=== DEBUG: getCompletedCoursesCount ===");
            System.out.println("userId: " + userId);
            
            // Pobierz wszystkie zapisy użytkownika na kursy
            List<UserKurs> userKursy = userKursRepository.findByUser_IdUser(userId);
            System.out.println("Znaleziono zapisów na kursy: " + userKursy.size());
            
            // Policz ukończone kursy (gdzie ukonczony = true)
            long completedCount = userKursy.stream()
                .filter(UserKurs::getUkonczony)
                .count();
            
            System.out.println("Ukończone kursy: " + completedCount);
            
            return completedCount;
            
        } catch (Exception e) {
            System.err.println("!!! BŁĄD W getCompletedCoursesCount !!!");
            System.err.println("userId: " + userId);
            e.printStackTrace();
            return 0L;
        }
    }
    
}