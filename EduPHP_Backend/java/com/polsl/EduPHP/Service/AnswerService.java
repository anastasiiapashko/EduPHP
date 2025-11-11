package com.polsl.EduPHP.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.polsl.EduPHP.DTO.AnswerDTO;
import com.polsl.EduPHP.model.Answer;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.model.UserComplain;
import com.polsl.EduPHP.Repository.AnswerRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AnswerService {

    @Autowired
    private AnswerRepository answerRepository;

    public List<Answer> getAnswersByComplainId(Integer complainId) {
        return answerRepository.findByUserComplain_IdAppOrderByDateCreatedAsc(complainId);
    }

    public Answer createAnswer(Answer answer, User user, UserComplain userComplain) {
        answer.setUser(user);
        answer.setUserComplain(userComplain);
        answer.setDateCreated(LocalDateTime.now());
        return answerRepository.save(answer);
    }

    public Optional<Answer> getAnswerById(Integer id) {
        return answerRepository.findById(id);
    }

    public void deleteAnswer(Integer id) {
        answerRepository.deleteById(id);
    }

    public Answer updateAnswer(Answer answer) {
        return answerRepository.save(answer);
    }

    public boolean answerExists(Integer id) {
        return answerRepository.existsById(id);
    }

    public void deleteAnswersByComplainId(Integer complainId) {
        answerRepository.deleteByUserComplain_IdApp(complainId);
    }

    public long countAnswersByComplainId(Integer complainId) {
        return answerRepository.countByUserComplain_IdApp(complainId);
    }

    public AnswerDTO convertToDTO(Answer answer) {
        AnswerDTO dto = new AnswerDTO();
        dto.setIdAnswer(answer.getIdAnswer());
        dto.setContent(answer.getContent());
        dto.setDateCreated(answer.getDateCreated());
        
        if (answer.getUser() != null) {
            dto.setUserId(answer.getUser().getIdUser());
            dto.setUserLogin(answer.getUser().getLogin());
            dto.setUserName(answer.getUser().getFirstName() + " " + answer.getUser().getSecondName());
        }
        
        if (answer.getUserComplain() != null) {
            dto.setUserComplainId(answer.getUserComplain().getIdApp());
        }
        
        return dto;
    }

    public List<AnswerDTO> convertToDTOList(List<Answer> answers) {
        return answers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
}