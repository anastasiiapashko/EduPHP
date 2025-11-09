package com.polsl.EduPHP.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.polsl.EduPHP.model.User;

@Repository
public interface UserRepository extends CrudRepository<User, Integer> {
	Optional<User> findByLogin(String login);
	
	@Query("SELECT u.sandboxUserId FROM User u WHERE u.idUser = :userId")  // ← idUser zamiast id
	Optional<Integer> findSandboxUserIdByUserId(@Param("userId") Integer userId);
	
	Optional<User> findBySandboxUserId(Integer sandboxUserId);
}





