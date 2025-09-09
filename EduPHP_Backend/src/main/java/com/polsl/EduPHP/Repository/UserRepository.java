package com.polsl.EduPHP.Repository;

import java.util.Optional;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.polsl.EduPHP.model.User;

@Repository
public interface UserRepository extends CrudRepository<User, Integer> {
	Optional<User> findByLogin(String login);
}





