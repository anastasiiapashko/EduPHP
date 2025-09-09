package com.polsl.EduPHP.Repository;

import com.polsl.EduPHP.model.UserKurs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserKursRepository extends JpaRepository<UserKurs, Long> {
    
    Optional<UserKurs> findByUser_IdUserAndKurs_IdKursu(Integer userId, Integer kursId);
    
    List<UserKurs> findByUser_IdUser(Integer userId);
    
    List<UserKurs> findByKurs_IdKursu(Integer kursId);
    
    List<UserKurs> findByUser_IdUserAndUkonczony(Integer userId, Boolean ukonczony);
    
    List<UserKurs> findByKurs_IdKursuAndUkonczony(Integer kursId, Boolean ukonczony);
    
    @Query("SELECT COUNT(uk) FROM UserKurs uk WHERE uk.kurs.idKursu = :kursId AND uk.ukonczony = true")
    Long countUkonczonychByKursId(@Param("kursId") Integer kursId);
}