package com.polsl.EduPHP.Repository;

import com.polsl.EduPHP.model.Application;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApplicationRepository extends CrudRepository<Application, Integer> {
    
    List<Application> findAllByOrderByDatePublishDesc();
    
    List<Application> findByUser_IdUser(Integer userId);
    
     List<Application> findAll();
}