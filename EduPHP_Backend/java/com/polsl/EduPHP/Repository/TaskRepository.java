package com.polsl.EduPHP.Repository;

import com.polsl.EduPHP.model.Task;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends CrudRepository<Task, Integer> {
    List<Task> findByKurs_IdKursu(Integer idKursu);
}