package com.polsl.EduPHP.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.polsl.EduPHP.DTO.AnswerDTO;
import com.polsl.EduPHP.model.Answer;
import com.polsl.EduPHP.model.User;
import com.polsl.EduPHP.model.UserComplain;
import com.polsl.EduPHP.Service.AnswerService;
import com.polsl.EduPHP.Service.UserService;
import com.polsl.EduPHP.Service.UserComplainService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/answers")
public class AnswerController {

    @Autowired
    private AnswerService answerService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserComplainService userComplainService;

    @GetMapping("/complain/{complainId}")
    public ResponseEntity<List<AnswerDTO>> getAnswersByComplainId(@PathVariable Integer complainId) {
        List<Answer> answers = answerService.getAnswersByComplainId(complainId);
        List<AnswerDTO> answerDTOs = answerService.convertToDTOList(answers);
        return ResponseEntity.ok(answerDTOs);
    }

    @PostMapping("/complain/{complainId}/user/{userId}")
    public ResponseEntity<AnswerDTO> createAnswer(
            @PathVariable Integer complainId,
            @PathVariable Integer userId,
            @RequestBody Answer answer) {
        
        Optional<User> user = userService.findById(userId);
        Optional<UserComplain> userComplain = userComplainService.getApplicationById(complainId);

        if (user.isPresent() && userComplain.isPresent()) {
            Answer savedAnswer = answerService.createAnswer(answer, user.get(), userComplain.get());
            AnswerDTO answerDTO = answerService.convertToDTO(savedAnswer);
            return ResponseEntity.ok(answerDTO);
        }
        
        return ResponseEntity.badRequest().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnswerDTO> updateAnswer(
            @PathVariable Integer id,
            @RequestBody Answer answerDetails) {
        
        if (!answerService.answerExists(id)) {
            return ResponseEntity.notFound().build();
        }

        Optional<Answer> answer = answerService.getAnswerById(id);
        
        if (answer.isPresent()) {
            Answer existingAnswer = answer.get();
            existingAnswer.setContent(answerDetails.getContent());
            
            Answer updatedAnswer = answerService.updateAnswer(existingAnswer);
            AnswerDTO answerDTO = answerService.convertToDTO(updatedAnswer);
            return ResponseEntity.ok(answerDTO);
        }
        
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnswer(@PathVariable Integer id) {
        if (!answerService.answerExists(id)) {
            return ResponseEntity.notFound().build();
        }

        answerService.deleteAnswer(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/complain/{complainId}/count")
    public ResponseEntity<Long> getAnswersCountByComplainId(@PathVariable Integer complainId) {
        long count = answerService.countAnswersByComplainId(complainId);
        return ResponseEntity.ok(count);
    }
}