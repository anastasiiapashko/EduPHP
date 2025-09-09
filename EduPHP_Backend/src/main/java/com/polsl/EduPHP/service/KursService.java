package com.polsl.EduPHP.service;

import com.polsl.EduPHP.model.*;
import com.polsl.EduPHP.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class KursService {

    @Autowired
    private KursRepository kursRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserKursRepository userKursRepository;

    public List<Kurs> getAllKursy() {
        return (List<Kurs>) kursRepository.findAll();
    }
    
    public Optional<Kurs> getKursById(Integer id) {
        return kursRepository.findById(id);
    }
    
    public Kurs saveKurs(Kurs kurs) {
        if (kurs.getIdKursu() == null) {
            kurs.setIdKursu(findNextAvailableId());
        }
        return kursRepository.save(kurs);
    }
    
    public void deleteKurs(Integer id) {
        Optional<Kurs> kursOpt = kursRepository.findById(id);
        if (!kursOpt.isPresent()) {
            throw new IllegalArgumentException("Kurs o ID " + id + " nie istnieje");
        }
        
        // Usuń powiązane rekordy w user_kurs
        List<UserKurs> userKursy = userKursRepository.findByKurs_IdKursu(id);
        if (!userKursy.isEmpty()) {
            userKursRepository.deleteAll(userKursy);
        }
        
        try {
            kursRepository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Nie można usunąć kursu z powodu powiązanych danych: " + e.getMessage());
        }
    }
    
    // Nowa metoda do znajdowania najmniejszego dostępnego ID
    private Integer findNextAvailableId() {
        List<Kurs> allKursy = (List<Kurs>) kursRepository.findAll();
        if (allKursy.isEmpty()) {
            return 1; // Pusta tabela -> ID = 1
        }
        
        // Znajdź wszystkie użyte ID i posortuj
        List<Integer> usedIds = allKursy.stream()
                .map(Kurs::getIdKursu)
                .sorted()
                .collect(Collectors.toList());
        
        // Znajdź pierwszą lukę w numeracji
        int expectedId = 1;
        for (Integer id : usedIds) {
            if (id > expectedId) {
                return expectedId; // Zwróć pierwszą brakującą liczbę
            }
            expectedId = id + 1;
        }
        return expectedId; // Jeśli nie ma luk, zwróć kolejny ID
    }
    
    public UserKurs addUserToKurs(Integer userId, Integer kursId, Boolean ukonczony) {
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<Kurs> kursOpt = kursRepository.findById(kursId);
        
        if (userOpt.isPresent() && kursOpt.isPresent()) {
            Optional<UserKurs> existing = userKursRepository.findByUser_IdUserAndKurs_IdKursu(userId, kursId);
            if (existing.isPresent()) {
                UserKurs userKurs = existing.get();
                userKurs.setUkonczony(ukonczony);
                return userKursRepository.save(userKurs);
            }
            
            UserKurs userKurs = new UserKurs();
            userKurs.setUser(userOpt.get());
            userKurs.setKurs(kursOpt.get());
            userKurs.setUkonczony(ukonczony);
            
            return userKursRepository.save(userKurs);
        }
        return null;
    }
    
    public void removeUserFromKurs(Integer kursId, Integer userId) {
        Optional<UserKurs> userKurs = userKursRepository.findByUser_IdUserAndKurs_IdKursu(userId, kursId);
        userKurs.ifPresent(userKursRepository::delete);
    }
    
    public List<Kurs> getKursyByUserId(Integer userId) {
        List<UserKurs> userKursy = userKursRepository.findByUser_IdUser(userId);
        return userKursy.stream()
                .map(UserKurs::getKurs)
                .collect(Collectors.toList());
    }
    
    public Boolean isKursUkonczony(Integer userId, Integer kursId) {
        Optional<UserKurs> userKurs = userKursRepository.findByUser_IdUserAndKurs_IdKursu(userId, kursId);
        return userKurs.map(UserKurs::getUkonczony).orElse(false);
    }
    
    public Long getLiczbaUkonczonychByKurs(Integer kursId) {
        return userKursRepository.findByKurs_IdKursuAndUkonczony(kursId, true)
                .stream()
                .count();
    }
}