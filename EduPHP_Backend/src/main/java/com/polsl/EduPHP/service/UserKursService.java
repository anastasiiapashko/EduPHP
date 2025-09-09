package com.polsl.EduPHP.service;

import com.polsl.EduPHP.model.*;
import com.polsl.EduPHP.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserKursService {

    @Autowired
    private UserKursRepository userKursRepository;
    
    @Autowired 
    private UserRepository userRepository;
    
    @Autowired 
    private KursRepository kursRepository;
    
    public UserKurs zapiszUzytkownikaDoKursu(Integer userId, Integer kursId, Boolean ukonczony) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Kurs> kursOpt = kursRepository.findById(kursId);
        
        if (userOpt.isPresent() && kursOpt.isPresent()) {
            // Sprawdź czy już istnieje
            Optional<UserKurs> existing = userKursRepository.findByUser_IdUserAndKurs_IdKursu(userId, kursId);
            if (existing.isPresent()) {
                UserKurs userKurs = existing.get();
                userKurs.setUkonczony(ukonczony);
                return userKursRepository.save(userKurs);
            }
            
            // Utwórz nowy
            UserKurs userKurs = new UserKurs();
            userKurs.setUser(userOpt.get());
            userKurs.setKurs(kursOpt.get());
            userKurs.setUkonczony(ukonczony);
            
            return userKursRepository.save(userKurs);
        }
        return null;
    }
    
    public Boolean getStatusUkonczenia(Integer userId, Integer kursId) {
        Optional<UserKurs> userKurs = userKursRepository.findByUser_IdUserAndKurs_IdKursu(userId, kursId);
        return userKurs.map(UserKurs::getUkonczony).orElse(false);
    }
    
    public Boolean setStatusUkonczenia(Integer userId, Integer kursId, Boolean ukonczony) {
        Optional<UserKurs> userKurs = userKursRepository.findByUser_IdUserAndKurs_IdKursu(userId, kursId);
        if (userKurs.isPresent()) {
            UserKurs uk = userKurs.get();
            uk.setUkonczony(ukonczony);
            userKursRepository.save(uk);
            return true;
        }
        return false;
    }
    
    public List<Kurs> getKursyUzytkownika(Integer userId, Boolean ukonczony) {
        List<UserKurs> userKursy;
        if (ukonczony != null) {
            userKursy = userKursRepository.findByUser_IdUserAndUkonczony(userId, ukonczony);
        } else {
            userKursy = userKursRepository.findByUser_IdUser(userId);
        }
        
        return userKursy.stream()
                .map(UserKurs::getKurs)
                .toList();
    }
    
    public Long getLiczbaUkonczonychKursow(Integer userId) {
        return userKursRepository.findByUser_IdUserAndUkonczony(userId, true)
                .stream()
                .count();
    }
    
    public Long getLiczbaUzytkownikowKursu(Integer kursId, Boolean ukonczony) {
        if (ukonczony != null) {
            return userKursRepository.findByKurs_IdKursuAndUkonczony(kursId, ukonczony)
                    .stream()
                    .count();
        }
        return userKursRepository.findByKurs_IdKursu(kursId)
                .stream()
                .count();
    }
}