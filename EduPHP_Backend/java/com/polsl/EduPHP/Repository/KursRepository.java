package com.polsl.EduPHP.Repository;

import com.polsl.EduPHP.model.Kurs;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KursRepository extends CrudRepository<Kurs, Integer> {
}