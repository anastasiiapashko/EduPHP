package com.polsl.EduPHP.Repository;

import com.polsl.EduPHP.model.Profil;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProfilRepository extends CrudRepository<Profil, Integer> {
   
    Profil findByUserIdUser(Integer idUser);
}