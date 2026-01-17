package com.polsl.EduPHP.Controller;

import com.polsl.EduPHP.Service.TaskService;
import com.polsl.EduPHP.model.Task;
import com.polsl.EduPHP.DTO.TaskDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/task")
public class TaskController {
    
    @Autowired
    private TaskService taskService;
    
    @GetMapping("/all")
    public ResponseEntity<List<Task>> getAllTasks() {
        List<Task> tasks = taskService.getAllTasks();
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/all-dto")
    public ResponseEntity<List<TaskDTO>> getAllTasksDTO() {
        List<TaskDTO> tasks = taskService.getAllTasksDTO();
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Integer id) {
        Optional<Task> task = taskService.getTaskById(id);
        return task.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/dto/{id}")
    public ResponseEntity<TaskDTO> getTaskDTOById(@PathVariable Integer id) {
        Optional<TaskDTO> task = taskService.getTaskDTOById(id);
        return task.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/kurs/{kursId}")
    public ResponseEntity<List<Task>> getTasksByKursId(@PathVariable Integer kursId) {
        List<Task> tasks = taskService.getTasksByKursId(kursId);
        return ResponseEntity.ok(tasks);
    }
    
    @PostMapping("/create")
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task savedTask = taskService.saveTask(task);
        return ResponseEntity.ok(savedTask);
    }
    
    @PostMapping("/create-dto")
    public ResponseEntity<TaskDTO> createTaskDTO(@RequestBody TaskDTO taskDTO) {
        Task savedTask = taskService.saveTaskFromDTO(taskDTO);
        TaskDTO responseDTO = taskService.convertToDTO(savedTask);
        return ResponseEntity.ok(responseDTO);
    }
    
    @PostMapping("/create/kurs/{kursId}")
    public ResponseEntity<Task> createTaskForKurs(@PathVariable Integer kursId, @RequestBody Task task) {
        try {
            Task savedTask = taskService.createTaskForKurs(kursId, task);
            return ResponseEntity.ok(savedTask);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/create-dto/kurs/{kursId}")
    public ResponseEntity<TaskDTO> createTaskForKursDTO(@PathVariable Integer kursId, @RequestBody TaskDTO taskDTO) {
        try {
            Task savedTask = taskService.createTaskForKursFromDTO(kursId, taskDTO);
            TaskDTO responseDTO = taskService.convertToDTO(savedTask);
            return ResponseEntity.ok(responseDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/update/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Integer id, @RequestBody Task taskDetails) {
        try {
            Task updatedTask = taskService.updateTask(id, taskDetails);
            return ResponseEntity.ok(updatedTask);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/update-dto/{id}")
    public ResponseEntity<TaskDTO> updateTaskDTO(@PathVariable Integer id, @RequestBody TaskDTO taskDTO) {
        try {
            Task updatedTask = taskService.updateTaskFromDTO(id, taskDTO);
            TaskDTO responseDTO = taskService.convertToDTO(updatedTask);
            return ResponseEntity.ok(responseDTO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteTask(@PathVariable Integer id) {
        try {
            taskService.deleteTask(id);
            return ResponseEntity.ok("Task usunięty pomyślnie");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Błąd serwera podczas usuwania taska: " + e.getMessage());
        }
    }
    
    @DeleteMapping("/kurs/{kursId}/delete-all")
    public ResponseEntity<String> deleteTasksByKursId(@PathVariable Integer kursId) {
        taskService.deleteTasksByKursId(kursId);
        return ResponseEntity.ok("Wszystkie taski dla kursu " + kursId + " zostały usunięte");
    }
    
    @RequestMapping(method = RequestMethod.OPTIONS, value = "/**")
    public ResponseEntity<?> handleOptions() {
        return ResponseEntity.ok().build();
    }
}