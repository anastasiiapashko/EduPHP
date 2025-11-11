package com.polsl.EduPHP.Repository;

import com.polsl.EduPHP.model.Answer;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnswerRepository extends CrudRepository<Answer, Integer> {
    
    List<Answer> findByUserComplain_IdAppOrderByDateCreatedAsc(Integer userComplainId);
    
    List<Answer> findByUser_IdUser(Integer userId);
    
    void deleteByUserComplain_IdApp(Integer userComplainId);
    
    long countByUserComplain_IdApp(Integer userComplainId);
}