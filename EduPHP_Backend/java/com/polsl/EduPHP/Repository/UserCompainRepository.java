package com.polsl.EduPHP.Repository;

import com.polsl.EduPHP.model.UserCompain;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserCompainRepository extends CrudRepository<UserCompain, Integer> {
    
    List<UserCompain> findAllByOrderByDatePublishDesc();
    
    List<UserCompain> findByUser_IdUser(Integer userId);
    
     List<UserCompain> findAll();
}