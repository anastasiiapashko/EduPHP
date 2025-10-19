package com.polsl.EduPHP.Service;

import com.polsl.EduPHP.model.Task;
import com.polsl.EduPHP.model.Kurs;
import com.polsl.EduPHP.Repository.TaskRepository;
import com.polsl.EduPHP.Repository.KursRepository;
import com.polsl.EduPHP.DTO.TaskDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private KursRepository kursRepository;

    public List<Task> getAllTasks() {
        return (List<Task>) taskRepository.findAll();
    }
    
    // Nowa metoda do zwracania DTO
    public List<TaskDTO> getAllTasksDTO() {
        List<Task> tasks = (List<Task>) taskRepository.findAll();
        return tasks.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Optional<Task> getTaskById(Integer id) {
        return taskRepository.findById(id);
    }
    
    public Optional<TaskDTO> getTaskDTOById(Integer id) {
        return taskRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    public List<Task> getTasksByKursId(Integer kursId) {
        return taskRepository.findByKurs_IdKursu(kursId);
    }
    
    public Task saveTask(Task task) {
        return taskRepository.save(task);
    }
    
    // Nowa metoda do zapisywania z DTO
    public Task saveTaskFromDTO(TaskDTO taskDTO) {
        Task task = convertToEntity(taskDTO);
        return taskRepository.save(task);
    }
    
    public Task createTaskForKurs(Integer kursId, Task task) {
        Optional<Kurs> kursOpt = kursRepository.findById(kursId);
        if (kursOpt.isPresent()) {
            task.setKurs(kursOpt.get());
            return taskRepository.save(task);
        }
        throw new IllegalArgumentException("Kurs o ID " + kursId + " nie istnieje");
    }
    
    // Nowa metoda do tworzenia z DTO
    public Task createTaskForKursFromDTO(Integer kursId, TaskDTO taskDTO) {
        Optional<Kurs> kursOpt = kursRepository.findById(kursId);
        if (kursOpt.isPresent()) {
            Task task = convertToEntity(taskDTO);
            task.setKurs(kursOpt.get());
            return taskRepository.save(task);
        }
        throw new IllegalArgumentException("Kurs o ID " + kursId + " nie istnieje");
    }
    
    public Task updateTask(Integer id, Task taskDetails) {
        Optional<Task> taskOpt = taskRepository.findById(id);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setTytul(taskDetails.getTytul());
            task.setDescription(taskDetails.getDescription());
            task.setInputs(taskDetails.getInputs());
            task.setOutputs(taskDetails.getOutputs());
            task.setDifficulty(taskDetails.getDifficulty());
            
            if (taskDetails.getKurs() != null) {
                task.setKurs(taskDetails.getKurs());
            }
            
            return taskRepository.save(task);
        }
        throw new IllegalArgumentException("Task o ID " + id + " nie istnieje");
    }
    
    // Nowa metoda do aktualizacji z DTO
    public Task updateTaskFromDTO(Integer id, TaskDTO taskDTO) {
        Optional<Task> taskOpt = taskRepository.findById(id);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setTytul(taskDTO.getTytul());
            task.setDescription(taskDTO.getDescription());
            task.setInputs(taskDTO.getInputs());
            task.setOutputs(taskDTO.getOutputs());
            task.setDifficulty(taskDTO.getDifficulty());
            
            if (taskDTO.getKursId() != null) {
                Optional<Kurs> kursOpt = kursRepository.findById(taskDTO.getKursId());
                kursOpt.ifPresent(task::setKurs);
            }
            
            return taskRepository.save(task);
        }
        throw new IllegalArgumentException("Task o ID " + id + " nie istnieje");
    }
    
    public void deleteTask(Integer id) {
        if (!taskRepository.existsById(id)) {
            throw new IllegalArgumentException("Task o ID " + id + " nie istnieje");
        }
        taskRepository.deleteById(id);
    }
    
    public void deleteTasksByKursId(Integer kursId) {
        List<Task> tasks = taskRepository.findByKurs_IdKursu(kursId);
        taskRepository.deleteAll(tasks);
    }
    
    // Metody konwersji
    public TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setIdTask(task.getIdTask());
        dto.setTytul(task.getTytul());
        dto.setDescription(task.getDescription());
        dto.setInputs(task.getInputs());
        dto.setOutputs(task.getOutputs());
        dto.setDifficulty(task.getDifficulty());
        if (task.getKurs() != null) {
            dto.setKursId(task.getKurs().getIdKursu());
        }
        return dto;
    }
    
    private Task convertToEntity(TaskDTO dto) {
        Task task = new Task();
        task.setIdTask(dto.getIdTask());
        task.setTytul(dto.getTytul());
        task.setDescription(dto.getDescription());
        task.setInputs(dto.getInputs());
        task.setOutputs(dto.getOutputs());
        task.setDifficulty(dto.getDifficulty());
        // Kurs ustawiany osobno
        return task;
    }
}