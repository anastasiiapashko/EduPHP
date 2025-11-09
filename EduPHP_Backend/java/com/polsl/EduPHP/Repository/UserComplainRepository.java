package com.polsl.EduPHP.Repository;

import com.polsl.EduPHP.model.UserComplain;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserComplainRepository extends CrudRepository<UserComplain, Integer> {
    
    List<UserComplain> findAllByOrderByDatePublishDesc();
    
    List<UserComplain> findByUser_IdUser(Integer userId);
    
     List<UserComplain> findAll();
}