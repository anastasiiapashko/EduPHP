package com.polsl.EduPHP.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.polsl.EduPHP.DTO.UserComplainDTO;
import com.polsl.EduPHP.Repository.UserComplainRepository;
import com.polsl.EduPHP.model.UserComplain;
import com.polsl.EduPHP.model.User;

@Service
public class UserComplainService {

	@Autowired
	private UserComplainRepository applicationRepository;
	
	public List<UserComplain> getAllApplications(){
		return applicationRepository.findAllByOrderByDatePublishDesc();
	}
	
	public List<UserComplain> getUserApplications(Integer userId){
		return applicationRepository.findByUser_IdUser(userId);
	}
	
	public UserComplain createApplication(UserComplain application, User user) {
		application.setUser(user);
		application.setDatePublish(LocalDateTime.now());
		return applicationRepository.save(application);
	}
	
	public Optional<UserComplain> getApplicationById(Integer id) {
        return applicationRepository.findById(id);
    }

    public void deleteApplication(Integer id) {
        applicationRepository.deleteById(id);
    }

    public UserComplain updateApplication(UserComplain application) {
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
    
    public UserComplainDTO convertToDTO(UserComplain app) {
        UserComplainDTO dto = new UserComplainDTO();
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
