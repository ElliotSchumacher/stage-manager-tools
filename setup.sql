/* TODO: ADD YOUR HEADER COMMENT HERE */

DROP DATABASE IF EXISTS smTools;

CREATE DATABASE smTools;
USE smTools;

DROP TABLE IF EXISTS Users;

CREATE TABLE Users(
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(16) UNIQUE NOT NULL,
  password VARCHAR(64) NOT NULL,
  hint VARCHAR(32) NOT NULL,
  date_created DATETIME DEFAULT NOW(),
  session_number INT
);

DROP TABLE IF EXISTS Posts;

CREATE TABLE Posts(
  id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  user_id INT 
);