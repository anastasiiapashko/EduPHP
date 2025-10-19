package com.polsl.EduPHP.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.polsl.EduPHP.DTO.ApplicationDTO;
import com.polsl.EduPHP.Repository.ApplicationRepository;
import com.polsl.EduPHP.model.Application;
import com.polsl.EduPHP.model.User;

@Service
public class ApplicationService {

	@Autowired
	private ApplicationRepository applicationRepository;
	
	public List<Application> getAllApplications(){
		return applicationRepository.findAllByOrderByDatePublishDesc();
	}
	
	public List<Application> getUserApplications(Integer userId){
		return applicationRepository.findByUser_IdUser(userId);
	}
	
	public Application createApplication(Application application, User user) {
		application.setUser(user);
		application.setDatePublish(LocalDateTime.now());
		return applicationRepository.save(application);
	}
	
	public Optional<Application> getApplicationById(Integer id) {
        return applicationRepository.findById(id);
    }

    public void deleteApplication(Integer id) {
        applicationRepository.deleteById(id);
    }

    public Application updateApplication(Application application) {
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
    
    public ApplicationDTO convertToDTO(Application app) {
        ApplicationDTO dto = new ApplicationDTO();
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
