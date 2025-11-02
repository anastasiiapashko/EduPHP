package com.polsl.EduPHP.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.polsl.EduPHP.DTO.UserCompainDTO;
import com.polsl.EduPHP.Repository.UserCompainRepository;
import com.polsl.EduPHP.model.UserCompain;
import com.polsl.EduPHP.model.User;

@Service
public class UserCompainService {

	@Autowired
	private UserCompainRepository applicationRepository;
	
	public List<UserCompain> getAllApplications(){
		return applicationRepository.findAllByOrderByDatePublishDesc();
	}
	
	public List<UserCompain> getUserApplications(Integer userId){
		return applicationRepository.findByUser_IdUser(userId);
	}
	
	public UserCompain createApplication(UserCompain application, User user) {
		application.setUser(user);
		application.setDatePublish(LocalDateTime.now());
		return applicationRepository.save(application);
	}
	
	public Optional<UserCompain> getApplicationById(Integer id) {
        return applicationRepository.findById(id);
    }

    public void deleteApplication(Integer id) {
        applicationRepository.deleteById(id);
    }

    public UserCompain updateApplication(UserCompain application) {
        return applicationRepository.save(application);
    }

    // Dodatkowa metoda do sprawdzenia istnienia
    public boolean applicationExists(Integer id) {
        return applicationRepository.existsById(id);
    }

    // Metoda do zliczania wszystkich zgłoszeń
    public long countAllApplications() {
        return applicationRepository.count();
    }
    
    public UserCompainDTO convertToDTO(UserCompain app) {
        UserCompainDTO dto = new UserCompainDTO();
        dto.setIdApp(app.getIdApp());
        dto.setTytul(app.getTytul());
        dto.setOpis(app.getOpis());
        dto.setDatePublish(app.getDatePublish());

        if (app.getUser() != null) {
            dto.setUserId(app.getUser().getIdUser());
            dto.setUserLogin(app.getUser().getLogin()); // ← tylko login, bez reszty
        }
        return dto;
    }
}
