package com.polsl.EduPHP.Repository;

import com.polsl.EduPHP.model.UserTask;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTaskRepository extends CrudRepository<UserTask, Integer> {
    
    Optional<UserTask> findByUser_IdUserAndTask_IdTask(Integer userId, Integer taskId);
    
    List<UserTask> findByUser_IdUser(Integer userId);
    
    List<UserTask> findByUser_IdUserAndTask_Kurs_IdKursu(Integer userId, Integer kursId);
    
    List<UserTask> findByTask_IdTask(Integer taskId);
    
    List<UserTask> findByUser_IdUserAndStatus(Integer userId, String status);
    
    List<UserTask> findByTask_Kurs_IdKursu(Integer kursId);
    
    // Statystyki postępu
    long countByUser_IdUserAndStatus(Integer userId, String status);
    
    long countByUser_IdUserAndTask_Kurs_IdKursuAndStatus(Integer userId, Integer kursId, String status);
}