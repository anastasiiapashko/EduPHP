package com.polsl.EduPHP.Service;

import com.polsl.EduPHP.DTO.UserTaskDTO;
import com.polsl.EduPHP.model.UserTask;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.model.Task;
import com.polsl.EduPHP.Repository.UserTaskRepository;
import com.polsl.EduPHP.Repository.UserRepository;
import com.polsl.EduPHP.Repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserTaskService {

    @Autowired
    private UserTaskRepository userTaskRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TaskRepository taskRepository;

    
    private UserTaskDTO mapToDTO(UserTask userTask) {
        if (userTask == null) return null;
        
        UserTaskDTO dto = new UserTaskDTO();
        dto.setIdUserTask(userTask.getIdUserTask());
        dto.setUserId(userTask.getUser().getIdUser());
        dto.setTaskId(userTask.getTask().getIdTask());
        dto.setStatus(userTask.getStatus());
        dto.setUserSolution(userTask.getUserSolution());
        dto.setStartDate(userTask.getStartDate());
        dto.setCompletionDate(userTask.getCompletionDate());
        dto.setAttempts(userTask.getAttempts());
        dto.setScore(userTask.getScore());
        
        
        Task task = userTask.getTask();
        if (task != null) {
            dto.setTaskTitle(task.getTytul());
            dto.setTaskDescription(task.getDescription());
            dto.setTaskDifficulty(task.getDifficulty());
            dto.setKursId(task.getKurs() != null ? task.getKurs().getIdKursu() : null);
        }
        
        return dto;
    }

    
    public UserTaskDTO startTask(Integer userId, Integer taskId) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        
        if (userOpt.isEmpty() || taskOpt.isEmpty()) {
            throw new IllegalArgumentException("Użytkownik lub zadanie nie istnieje");
        }
        
        // znaleźć istniejący rekord
        Optional<UserTask> existing = userTaskRepository.findByUser_IdUserAndTask_IdTask(userId, taskId);
        if (existing.isPresent()) {
            UserTask userTask = existing.get();
            if ("NOT_STARTED".equals(userTask.getStatus())) {
                userTask.setStatus("IN_PROGRESS");
                userTask.setStartDate(LocalDateTime.now());
                UserTask saved = userTaskRepository.save(userTask);
                return mapToDTO(saved);
            }
            return mapToDTO(userTask); // już istnieje, zwróć bez zmian
        }
        
        // Jeśli nie istnieje, utwórz nowy 
        try {
            UserTask userTask = new UserTask();
            userTask.setUser(userOpt.get());
            userTask.setTask(taskOpt.get());
            userTask.setStatus("IN_PROGRESS");
            userTask.setStartDate(LocalDateTime.now());
            userTask.setAttempts(0);
            userTask.setScore(0);
            
            UserTask saved = userTaskRepository.save(userTask);
            return mapToDTO(saved);
        } catch (DataIntegrityViolationException e) {
            
            Optional<UserTask> retryExisting = userTaskRepository.findByUser_IdUserAndTask_IdTask(userId, taskId);
            if (retryExisting.isPresent()) {
                return mapToDTO(retryExisting.get());
            }
            throw new IllegalArgumentException("Nie udało się utworzyć zadania");
        }
    }

    // Zapisz rozwiązanie użytkownika 
    public UserTaskDTO saveSolution(Integer userId, Integer taskId, String solution) {
        Optional<UserTask> userTaskOpt = userTaskRepository.findByUser_IdUserAndTask_IdTask(userId, taskId);
        
        if (userTaskOpt.isPresent()) {
            UserTask userTask = userTaskOpt.get();
            userTask.setUserSolution(solution);
            
            
            if ("NOT_STARTED".equals(userTask.getStatus())) {
                userTask.setStatus("IN_PROGRESS");
            }
            
            UserTask saved = userTaskRepository.save(userTask);
            return mapToDTO(saved);
        }
        throw new IllegalArgumentException("Nie znaleziono zadania dla użytkownika. Najpierw rozpocznij zadanie.");
    }

 
    public UserTaskDTO incrementAttemptOnly(Integer userId, Integer taskId) {
        Optional<UserTask> userTaskOpt = userTaskRepository.findByUser_IdUserAndTask_IdTask(userId, taskId);
        
        if (userTaskOpt.isPresent()) {
            UserTask userTask = userTaskOpt.get();
            userTask.setAttempts(userTask.getAttempts() + 1); 
            
            
            if ("NOT_STARTED".equals(userTask.getStatus())) {
                userTask.setStatus("IN_PROGRESS");
            }
            
            UserTask saved = userTaskRepository.save(userTask);
            return mapToDTO(saved);
        }
        throw new IllegalArgumentException("Nie znaleziono zadania dla użytkownika. Najpierw rozpocznij zadanie.");
    } 
    public Integer calculateScore(Integer timeSpentMinutes, Integer attempts) {
    	if(timeSpentMinutes == null || attempts == null) {
    		return 0;
    	}
    	
    	final int MAX_ATTEMPTS = 10;
    	final int MAX_TIME_MINUTES = 30; 
    	final double TIME_WEIGHT = 0.7; 	//70% waga czasu
    	final double ATTEMPTS_WEIGHT =0.3;  //30% waga prób
    	
    	
    	double normalizedTime; //Normalizacja czasu(0-1, gdzie 1 = najlepszy czas)
    	if(timeSpentMinutes <= 0) {
    		normalizedTime = 1.0;
    	} else if(timeSpentMinutes >= MAX_TIME_MINUTES){
    		normalizedTime = 0.0;
    	} else {
    		
    		normalizedTime = 1 - Math.pow(timeSpentMinutes / (double)MAX_TIME_MINUTES,0.7); //Funkcja wykładnicza - nagroda za szybkie rozwiązanie
    		normalizedTime = Math.max(0, Math.min(1, normalizedTime));
    	}
    	
    	double normalizedAttempts; //Normalizacja prób (0-1, gdzie 1 = najmniej prób)
    	if(attempts <= 1) {
    		normalizedAttempts = 1.0;
    	} else if (attempts >= MAX_ATTEMPTS) {
    		normalizedAttempts = 0.0;
    	} else {
    		
    		normalizedAttempts = 1 - (attempts - 1) / (double)(MAX_ATTEMPTS - 1); //Funkcja liniowa z lekkim wygładzeniem
    		normalizedAttempts = Math.max(0, Math.min(1, normalizedAttempts));
    	}
    	
    	double score = (normalizedTime * TIME_WEIGHT) + (normalizedAttempts * ATTEMPTS_WEIGHT); //Obliczenie wyniku z wagami
    	
    	return (int) Math.round(score * 10);//Skalowanie od 0-10 i zaokrąglanie
    }
    
    // Oznacz zadanie jako ukończone 
    public UserTaskDTO completeTask(Integer userId, Integer taskId, Integer timeSpentMinutes, Integer attempts) {
        Optional<UserTask> userTaskOpt = userTaskRepository.findByUser_IdUserAndTask_IdTask(userId, taskId);
        
        if (userTaskOpt.isPresent()) {
            UserTask userTask = userTaskOpt.get();
            userTask.setStatus("COMPLETED");
            userTask.setCompletionDate(LocalDateTime.now());
            
            //oblicz wynik automatyczne
            Integer score = calculateScore(timeSpentMinutes, attempts);
            userTask.setScore(score);
            
            UserTask saved = userTaskRepository.save(userTask);
            return mapToDTO(saved);
        }
        throw new IllegalArgumentException("Nie znaleziono zadania dla użytkownika");
    }

    
    public UserTaskDTO getUserTaskStatusDTO(Integer userId, Integer taskId) {
        Optional<UserTask> userTaskOpt = userTaskRepository.findByUser_IdUserAndTask_IdTask(userId, taskId);
        if (userTaskOpt.isPresent()) {
            return mapToDTO(userTaskOpt.get());
        }
        throw new IllegalArgumentException("Nie znaleziono zadania dla użytkownika");
    }

    
    public Optional<UserTask> getUserTaskStatus(Integer userId, Integer taskId) {
        return userTaskRepository.findByUser_IdUserAndTask_IdTask(userId, taskId);
    }

    
    public List<UserTaskDTO> getUserTasksInCourseDTO(Integer userId, Integer kursId) {
        List<UserTask> userTasks = userTaskRepository.findByUser_IdUserAndTask_Kurs_IdKursu(userId, kursId);
        return userTasks.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    
    public List<UserTaskDTO> getAllUserTasksDTO(Integer userId) {
        List<UserTask> userTasks = userTaskRepository.findByUser_IdUser(userId);
        return userTasks.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    
    public UserTaskDTO resetTask(Integer userId, Integer taskId) {
        Optional<UserTask> userTaskOpt = userTaskRepository.findByUser_IdUserAndTask_IdTask(userId, taskId);
        
        if (userTaskOpt.isPresent()) {
            UserTask userTask = userTaskOpt.get();
            userTask.setStatus("NOT_STARTED");
            userTask.setUserSolution(null);
            userTask.setAttempts(0);
            userTask.setScore(0);
            userTask.setCompletionDate(null);
            userTask.setStartDate(null);
            
            UserTask saved = userTaskRepository.save(userTask);
            return mapToDTO(saved);
        }
        throw new IllegalArgumentException("Nie znaleziono zadania dla użytkownika");
    }

    
    public Map<String, Object> getUserCourseProgress(Integer userId, Integer kursId) {
        List<UserTask> userTasks = getUserTasksInCourse(userId, kursId);
        List<Task> allTasksInCourse = taskRepository.findByKurs_IdKursu(kursId);
        
        long totalTasks = allTasksInCourse.size();
        long completedTasks = userTasks.stream()
                .filter(ut -> "COMPLETED".equals(ut.getStatus()))
                .count();
        long inProgressTasks = userTasks.stream()
                .filter(ut -> "IN_PROGRESS".equals(ut.getStatus()))
                .count();
        long notStartedTasks = totalTasks - completedTasks - inProgressTasks;
        
        Map<String, Object> progress = new HashMap<>();
        progress.put("totalTasks", totalTasks);
        progress.put("completedTasks", completedTasks);
        progress.put("inProgressTasks", inProgressTasks);
        progress.put("notStartedTasks", notStartedTasks);
        progress.put("completionPercentage", totalTasks > 0 ? (int)((completedTasks * 100.0) / totalTasks) : 0);
        
        return progress;
    }

    public List<UserTask> getUserTasksInCourse(Integer userId, Integer kursId) {
        return userTaskRepository.findByUser_IdUserAndTask_Kurs_IdKursu(userId, kursId);
    }

    public List<UserTask> getAllUserTasks(Integer userId) {
        return userTaskRepository.findByUser_IdUser(userId);
    }

    public Map<String, Object> getUserStatistics(Integer userId) {
        long totalTasks = userTaskRepository.findByUser_IdUser(userId).size();
        long completedTasks = userTaskRepository.countByUser_IdUserAndStatus(userId, "COMPLETED");
        long inProgressTasks = userTaskRepository.countByUser_IdUserAndStatus(userId, "IN_PROGRESS");
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTasks", totalTasks);
        stats.put("completedTasks", completedTasks);
        stats.put("inProgressTasks", inProgressTasks);
        stats.put("completionRate", totalTasks > 0 ? (int)((completedTasks * 100.0) / totalTasks) : 0);
        
        return stats;
    }
    
    
    public UserTaskDTO useHelpAndComplete(Integer userId, Integer taskId) {
        Optional<UserTask> userTaskOpt = userTaskRepository.findByUser_IdUserAndTask_IdTask(userId, taskId);
        
        UserTask userTask;
        
        if (userTaskOpt.isPresent()) {
            
            userTask = userTaskOpt.get();
        } else {
            
            Optional<User> userOpt = userRepository.findById(userId);
            Optional<Task> taskOpt = taskRepository.findById(taskId);
            
            if (userOpt.isEmpty() || taskOpt.isEmpty()) {
                throw new IllegalArgumentException("Użytkownik lub zadanie nie istnieje");
            }
            
            userTask = new UserTask();
            userTask.setUser(userOpt.get());
            userTask.setTask(taskOpt.get());
            userTask.setStartDate(LocalDateTime.now());
            userTask.setAttempts(0);
        }
        
        userTask.setStatus("COMPLETED");
        userTask.setCompletionDate(LocalDateTime.now());
        userTask.setScore(0); //  0 punktów za użycie pomocy
        
        UserTask saved = userTaskRepository.save(userTask);
        return mapToDTO(saved);
    }
    


    public List<UserTaskDTO> filterTasksByPeriod(List<UserTaskDTO> tasks, String period, String date) {
        if (tasks == null || tasks.isEmpty()) {
            return tasks;
        }
        
        LocalDateTime filterDate;
        try {
            filterDate = LocalDateTime.parse(date + "T00:00:00");
        } catch (Exception e) {
            return tasks;
        }
        
        return tasks.stream()
            .filter(task -> {
                LocalDateTime taskDate = getTaskDate(task);
                if (taskDate == null) return false;
                
                switch (period.toLowerCase()) {
                    case "weekly":
                        return isInSameWeek(taskDate, filterDate);
                    case "monthly":
                        return isInSameMonth(taskDate, filterDate);
                    case "yearly":
                        return isInSameYear(taskDate, filterDate);
                    default:
                        return true;
                }
            })
            .collect(Collectors.toList());
    }

    private LocalDateTime getTaskDate(UserTaskDTO task) {
        if (task.getCompletionDate() != null) {
            return task.getCompletionDate();
        } else if (task.getStartDate() != null) {
            return task.getStartDate();
        }
        return null;
    }

    private boolean isInSameWeek(LocalDateTime date1, LocalDateTime date2) {
        LocalDateTime startOfWeek1 = date1.with(java.time.DayOfWeek.MONDAY);
        LocalDateTime startOfWeek2 = date2.with(java.time.DayOfWeek.MONDAY);
        return startOfWeek1.toLocalDate().equals(startOfWeek2.toLocalDate());
    }

    private boolean isInSameMonth(LocalDateTime date1, LocalDateTime date2) {
        return date1.getMonth() == date2.getMonth() && 
               date1.getYear() == date2.getYear();
    }

    private boolean isInSameYear(LocalDateTime date1, LocalDateTime date2) {
        return date1.getYear() == date2.getYear();
    }
    
}