DROP DATABASE IF EXISTS studymate;
use studymate;
create database studymate;
CREATE TABLE `verification_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `social_provider` enum('naver','kakao','local') NOT NULL DEFAULT 'local',
  `social_id` varchar(255) DEFAULT NULL,
  `refresh_token` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
);
CREATE TABLE `social_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `memberId` int NOT NULL,
  `provider` varchar(20) NOT NULL,
  `socialId` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `isPrimary` tinyint(1) DEFAULT '0',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `memberId` (`memberId`),
  CONSTRAINT `user_social_accounts_ibfk_1` FOREIGN KEY (`memberId`) REFERENCES `users` (`id`)
) ;
show tables;
select * from users;
SELECT VERSION();
SELECT @@sql_mode;
SET GLOBAL sql_mode = (SELECT REPLACE(@@sql_mode, 'STRICT_TRANS_TABLES', ''));
SET GLOBAL sql_mode = (SELECT REPLACE(@@sql_mode, 'NO_ZERO_DATE', ''));