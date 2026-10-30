-- MySQL dump 10.13  Distrib 5.7.33, for Win64 (x86_64)
--
-- Host: localhost    Database: myAdmin
-- ------------------------------------------------------
-- Server version	5.7.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text,
  `affected_table` varchar(255) DEFAULT NULL,
  `affected_id` varchar(255) DEFAULT NULL,
  `old_values` text,
  `new_values` text,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,NULL,'System Administrator','admin@jms.gov.ph','SYSTEM_INITIALIZE','JMS System Administrator module initialized and verified on XianFire Framework','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','facility_settings','1',NULL,NULL,'2026-10-30 04:19:47'),(2,NULL,'System Administrator','admin@jms.gov.ph','ADMIN_LOGIN_SUCCESS','Administrator successfully logged in via administrative portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','users','1',NULL,NULL,'2026-10-30 04:19:47'),(3,NULL,'System Administrator','admin@jms.gov.ph','PDL_RECORD_CREATED','Created administrative PDL record for PDL-2026-0016 (Rolando Macaraig)','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','pdl_records','16',NULL,NULL,'2026-10-30 04:19:47'),(4,NULL,'System Administrator','admin@jms.gov.ph','SETTINGS_MODIFIED','Updated facility operational settings and emergency hotlines','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36','facility_settings','all',NULL,NULL,'2026-10-30 04:19:47');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `database_backups`
--

DROP TABLE IF EXISTS `database_backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `database_backups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `filepath` varchar(255) NOT NULL,
  `file_size` bigint(20) DEFAULT '0',
  `status` enum('Completed','Failed','Restored') NOT NULL DEFAULT 'Completed',
  `backup_type` enum('Manual','Scheduled','System') NOT NULL DEFAULT 'Manual',
  `notes` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `restored_at` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `database_backups`
--

LOCK TABLES `database_backups` WRITE;
/*!40000 ALTER TABLE `database_backups` DISABLE KEYS */;
INSERT INTO `database_backups` VALUES (1,'jms_baseline_initial_backup.sql','storage/backups/jms_baseline_initial_backup.sql',245760,'Completed','System','Initial system deployment baseline database snapshot','System Administrator',NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47');
/*!40000 ALTER TABLE `database_backups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facility_settings`
--

DROP TABLE IF EXISTS `facility_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `facility_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `value` text,
  `group` varchar(255) DEFAULT 'general',
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facility_settings`
--

LOCK TABLES `facility_settings` WRITE;
/*!40000 ALTER TABLE `facility_settings` DISABLE KEYS */;
INSERT INTO `facility_settings` VALUES (1,'facility_name','Metropolitan Regional Correctional Facility','facility','Official name of the correctional facility','2026-10-30 04:19:47','2026-10-30 04:19:47'),(2,'facility_code','MRCF-NCR-01','facility','Official facility identification code','2026-10-30 04:19:47','2026-10-30 04:19:47'),(3,'facility_address','Camp Bagong Diwa, Bicutan, Taguig City, Metro Manila, Philippines','facility','Physical location address','2026-10-30 04:19:47','2026-10-30 04:19:47'),(4,'contact_number','+63 (02) 8837-1234 / +63 917 555 4321','facility','Official telephone numbers','2026-10-30 04:19:47','2026-10-30 04:19:47'),(5,'emergency_hotline','117 / (02) 8838-9999','facility','24/7 Security and emergency hotline','2026-10-30 04:19:47','2026-10-30 04:19:47'),(6,'official_email','admin.mrcf@bjmp.gov.ph','facility','Official government email address','2026-10-30 04:19:47','2026-10-30 04:19:47'),(7,'warden_in_charge','J/SSUPT Leonardo S. Mendoza, DSC','facility','Appointed Jail Warden in charge','2026-10-30 04:19:47','2026-10-30 04:19:47'),(8,'system_name','JMS - Jail Management System','system','Application display name','2026-10-30 04:19:47','2026-10-30 04:19:47'),(9,'system_motto','Securing Persons Deprived of Liberty with Human Dignity','system','Official portal motto','2026-10-30 04:19:47','2026-10-30 04:19:47'),(10,'timezone','Asia/Manila (GMT+8)','system','Standard system timezone','2026-10-30 04:19:47','2026-10-30 04:19:47'),(11,'date_format','YYYY-MM-DD','system','Standard date display format','2026-10-30 04:19:47','2026-10-30 04:19:47'),(12,'session_timeout_minutes','30','security','Idle session timeout in minutes','2026-10-30 04:19:47','2026-10-30 04:19:47'),(13,'max_login_attempts','5','security','Maximum failed attempts before temporary account lockout','2026-10-30 04:19:47','2026-10-30 04:19:47'),(14,'lockout_duration_minutes','15','security','Account lockout duration in minutes','2026-10-30 04:19:47','2026-10-30 04:19:47'),(15,'min_password_length','8','security','Minimum length for administrative passwords','2026-10-30 04:19:47','2026-10-30 04:19:47'),(16,'require_special_char','true','security','Enforce symbols/numbers in passwords','2026-10-30 04:19:47','2026-10-30 04:19:47'),(17,'backup_reminder_days','7','backup','Interval in days to alert for database backups','2026-10-30 04:19:47','2026-10-30 04:19:47');
/*!40000 ALTER TABLE `facility_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('security','system','pdl','personnel','backup') NOT NULL DEFAULT 'system',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,NULL,'Scheduled Database Backup Reminder','It has been over 7 days since the last scheduled full database backup was generated. Please perform a manual backup.','backup',0,NULL,'/backups','2026-10-30 04:19:47','2026-10-30 04:19:47'),(2,NULL,'Suspicious Login Attempt Detected','An unauthorized attempt to sign in with incorrect credentials was logged from IP 192.168.1.145.','security',0,NULL,'/audit-logs','2026-10-30 04:19:47','2026-10-30 04:19:47'),(3,NULL,'New Personnel Account Added','Personnel account for J/INSP Michelle Gomez (Booking / Records Officer) was created by System Administrator.','personnel',0,NULL,'/personnel','2026-10-30 04:19:47','2026-10-30 04:19:47'),(4,NULL,'PDL Medical Transfer Alert','PDL-2026-0012 (Vicente Alcantara) was admitted to Jail Infirmary for medical monitoring.','pdl',0,NULL,'/pdl','2026-10-30 04:19:47','2026-10-30 04:19:47'),(5,NULL,'System Maintenance Completed','Routine database index maintenance and security policy checks completed successfully.','system',0,NULL,'/settings','2026-10-30 04:19:47','2026-10-30 04:19:47');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pdl_records`
--

DROP TABLE IF EXISTS `pdl_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pdl_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pdl_number` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `alias` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('Male','Female','Other') NOT NULL DEFAULT 'Male',
  `civil_status` enum('Single','Married','Widowed','Separated') NOT NULL DEFAULT 'Single',
  `nationality` varchar(255) NOT NULL DEFAULT 'Filipino',
  `address` text,
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(255) DEFAULT NULL,
  `case_number` varchar(255) NOT NULL,
  `court_branch` varchar(255) DEFAULT NULL,
  `offense_charge` varchar(255) NOT NULL,
  `risk_level` enum('Low','Medium','High','Maximum') NOT NULL DEFAULT 'Medium',
  `cell_block` varchar(255) NOT NULL,
  `admission_date` date NOT NULL,
  `detention_status` enum('Detained','On Trial','Convicted','Transferred','Released','Medical Facility') NOT NULL DEFAULT 'Detained',
  `release_date` date DEFAULT NULL,
  `release_reason` varchar(255) DEFAULT NULL,
  `medical_conditions` text,
  `remarks` text,
  `created_by` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pdl_number` (`pdl_number`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pdl_records`
--

LOCK TABLES `pdl_records` WRITE;
/*!40000 ALTER TABLE `pdl_records` DISABLE KEYS */;
INSERT INTO `pdl_records` VALUES (1,'PDL-2026-0001','Ramon','Castro','Dizon','Monching','1980-05-12','Male','Married','Filipino','Zone 4, Brgy. Central, Quezon City','Teresa Dizon (Wife)','+63 915 111 2201','CR-2026-0182','RTC Branch 104, Quezon City','Violation of Comprehensive Dangerous Drugs Act (Sec 5)','High','Block A - Cell 04','2026-01-10','Detained',NULL,NULL,'Hypertension, under regular BP monitoring','Commitment order issued Jan 10, 2026. Next hearing scheduled.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(2,'PDL-2026-0002','Eduardo','Tan','Lim','Eddie Boy','1976-09-21','Male','Single','Filipino','Binondo, Manila','Antonio Lim (Brother)','+63 916 222 3302','CR-2026-0311','RTC Branch 42, Manila','Qualified Theft & Falsification of Public Documents','Medium','Block B - Cell 12','2026-02-05','On Trial',NULL,NULL,'None reported','Bail petition under consideration by presiding judge.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(3,'PDL-2026-0003','Antonio','Reyes','Valdez','Tonying','1985-02-14','Male','Married','Filipino','Brgy. San Dionisio, Parañaque City','Corazon Valdez (Mother)','+63 917 333 4403','CR-2025-9941','RTC Branch 258, Parañaque City','Robbery with Intimidation','High','Block A - Cell 02','2025-11-18','Convicted',NULL,NULL,'Mild asthma','Awaiting final commitment order for transfer to Bureau of Corrections.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(4,'PDL-2026-0004','Manuel','Santos','Salazar','Manny','1990-07-28','Male','Single','Filipino','Brgy. Bangkal, Makati City','Gloria Salazar (Sister)','+63 918 444 5504','CR-2026-0612','MTC Branch 61, Makati City','Simple Estafa','Low','Block C - Dorm 1','2026-03-01','Released','2026-08-15','Bail Granted via Court Release Order','None','Discharged properly on August 15, 2026 with certificate of discharge.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(5,'PDL-2026-0005','Gabriel','Villanueva','Mercado','Gabby','1993-10-05','Male','Single','Filipino','Ususan, Taguig City','Rodrigo Mercado (Father)','+63 919 555 6605','CR-2026-0790','RTC Branch 266, Taguig City','Illegal Possession of Firearms and Ammunition (RA 10591)','High','Block A - Cell 08','2026-03-20','Detained',NULL,NULL,'Type 2 Diabetes mellitus','High security custody protocol active.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(6,'PDL-2026-0006','Christopher','Bautista','Aquino','Topher','1988-04-18','Male','Married','Filipino','Commonwealth, Quezon City','Luzviminda Aquino (Wife)','+63 920 666 7706','CR-2026-0922','RTC Branch 88, Quezon City','Homicide','Maximum','Max Security Wing - Cell 01','2026-04-14','On Trial',NULL,NULL,'None','Strict segregation advised due to high case sensitivity.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(7,'PDL-2026-0007','Jennifer','Lopez','Enriquez','Jenny','1994-12-03','Female','Single','Filipino','Brgy. Moonwalk, Parañaque City','Maricar Enriquez (Mother)','+63 921 777 8807','CR-2026-1044','RTC Branch 195, Parañaque City','Large-Scale Illegal Recruitment','Medium','Female Dormitory - Cell 03','2026-05-02','Detained',NULL,NULL,'Allergic rhinitis','Female dormitory intake complete.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(8,'PDL-2026-0008','Rodrigo','Flores','Pineda','Roding','1972-01-19','Male','Married','Filipino','Pateros, Metro Manila','Alicia Pineda (Wife)','+63 922 888 9908','CR-2026-1188','RTC Branch 153, Pasig City','Graft and Corrupt Practices (RA 3019)','Low','Block C - Dorm 2','2026-05-28','On Trial',NULL,NULL,'Coronary artery disease, requires cardiac maintenance medication','Monitored closely by jail medical officer.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(9,'PDL-2026-0009','Danilo','Geronimo','Soriano','Danny','1983-08-11','Male','Separated','Filipino','Barangka, Marikina City','Josephine Soriano (Sister)','+63 923 999 0009','CR-2026-1305','RTC Branch 272, Marikina City','Carnapping (RA 10883)','High','Block A - Cell 10','2026-06-12','Detained',NULL,NULL,'None','Co-accused with PDL-2026-0010.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(10,'PDL-2026-0010','Federico','Navarro','Castillo','Freddie','1986-03-25','Male','Single','Filipino','Concepcion Uno, Marikina City','Arlene Castillo (Mother)','+63 924 000 1110','CR-2026-1306','RTC Branch 272, Marikina City','Carnapping (RA 10883)','High','Block A - Cell 11','2026-06-12','Detained',NULL,NULL,'None','Co-accused with PDL-2026-0009.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(11,'PDL-2026-0011','Oscar','Morales','Cordero','Oca','1979-11-30','Male','Married','Filipino','Tondo, Manila','Remedios Cordero (Wife)','+63 925 111 2211','CR-2026-1490','RTC Branch 18, Manila','Frustrated Murder','Maximum','Max Security Wing - Cell 04','2026-07-08','Detained',NULL,NULL,'Chronic lower back pain','Maximum security watch list.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(12,'PDL-2026-0012','Vicente','Pascual','Alcantara','Enteng','1968-06-09','Male','Widowed','Filipino','Poblacion, Muntinlupa City','Giselle Alcantara (Daughter)','+63 926 222 3312','CR-2026-1601','RTC Branch 203, Muntinlupa City','Arson with Homicide','High','Medical Infirmary - Bed 02','2026-07-29','Medical Facility',NULL,NULL,'Severe COPD and post-stroke rehabilitation','Admitted directly into Jail Infirmary Unit for continuous medical supervision.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(13,'PDL-2026-0013','Jasmine','Cruz','Tolentino','Jas','1996-02-18','Female','Single','Filipino','Bicutan, Taguig City','Rowena Tolentino (Sister)','+63 927 333 4413','CR-2026-1755','MTC Branch 115, Taguig City','Cybercrime Act - Online Libel & Extortion','Low','Female Dormitory - Cell 01','2026-08-10','Released','2026-09-30','Case Dismissed / Compromise Agreement Approved','None','Released in accordance with Court Order dated Sept 30, 2026.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(14,'PDL-2026-0014','Ernesto','Del Rosario','Gutierrez','Erning','1982-12-14','Male','Married','Filipino','San Andres Bukid, Manila','Vilma Gutierrez (Wife)','+63 928 444 5514','CR-2026-1902','RTC Branch 12, Manila','Illegal Possession of Explosives','Maximum','Max Security Wing - Cell 06','2026-09-05','Detained',NULL,NULL,'Gastric ulcer','Escort security priority on all court transport dates.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(15,'PDL-2026-0015','Reynaldo','Mendoza','Bernardo','Rey','1987-10-27','Male','Single','Filipino','Bagong Silang, Caloocan City','Danilo Bernardo (Father)','+63 929 555 6615','CR-2026-2015','RTC Branch 122, Caloocan City','Robbery with Homicide','Maximum','Max Security Wing - Cell 02','2026-10-02','Transferred','2026-10-20','Transferred to New Bilibid Prison per Supreme Court Order','None','Safely transferred under high-risk convoy security.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47'),(16,'PDL-2026-0016','Rolando','Diaz','Macaraig','Lando','1991-05-08','Male','Single','Filipino','Pinagsama, Taguig City','Lucia Macaraig (Mother)','+63 930 666 7716','CR-2026-2140','RTC Branch 70, Pasig City','Illegal Recruitment & Estafa','Medium','Block B - Cell 05','2026-10-18','Detained',NULL,NULL,'None','Newly admitted PDL. Quarantine protocol observed.','System Administrator',0,NULL,'2026-10-30 04:19:47','2026-10-30 04:19:47');
/*!40000 ALTER TABLE `pdl_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personnel_profiles`
--

DROP TABLE IF EXISTS `personnel_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personnel_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `badge_number` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `rank` varchar(255) NOT NULL,
  `category` enum('Booking / Records Officer','Court Liaison / Legal Officer','Custodial / Gate Officer','Medical / Health Officer','Jail Warden') NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `emergency_contact` varchar(255) DEFAULT NULL,
  `address` text,
  `date_of_birth` date DEFAULT NULL,
  `date_hired` date DEFAULT NULL,
  `status` enum('active','inactive','locked') NOT NULL DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `notes` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `badge_number` (`badge_number`),
  UNIQUE KEY `email` (`email`),
  KEY `userId` (`userId`),
  CONSTRAINT `personnel_profiles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personnel_profiles`
--

LOCK TABLES `personnel_profiles` WRITE;
/*!40000 ALTER TABLE `personnel_profiles` DISABLE KEYS */;
INSERT INTO `personnel_profiles` VALUES (1,NULL,'P-JW-0001','Leonardo','Mendoza','Santos','Jail Senior Superintendent (J/SSUPT)','Jail Warden','l.mendoza@bjmp.gov.ph','+63 918 100 0001','Mrs. Carmela Mendoza (+63 918 100 0002)','Fort Bonifacio, Taguig City','1974-06-15','1998-04-01','active',NULL,'Facility Head / Jail Warden','2026-10-30 04:19:47','2026-10-30 04:19:47'),(2,NULL,'P-BK-1021','Michelle','Gomez','Reyes','Jail Inspector (J/INSP)','Booking / Records Officer','m.gomez@bjmp.gov.ph','+63 917 200 1021','Roberto Gomez (+63 917 200 1022)','San Antonio Village, Makati City','1988-09-22','2012-08-15','active',NULL,'Chief of Inmate Records Section','2026-10-30 04:19:47','2026-10-30 04:19:47'),(3,NULL,'P-BK-1025','Sarah Jane','Pascual','Diaz','Jail Officer 1 (JO1)','Booking / Records Officer','s.pascual@bjmp.gov.ph','+63 917 200 1025','Elena Pascual (+63 917 200 1026)','Signal Village, Taguig City','1995-11-04','2020-02-10','active',NULL,'Intake Biometrics & Documentation Assistant','2026-10-30 04:19:47','2026-10-30 04:19:47'),(4,NULL,'P-LG-2045','Fernando','Cruz','Bautista','Senior Jail Officer 4 (SJO4)','Court Liaison / Legal Officer','f.cruz@bjmp.gov.ph','+63 919 300 2045','Grace Cruz (+63 919 300 2046)','Kapitolyo, Pasig City','1980-03-18','2005-06-20','active',NULL,'Handles RTC and MTC Subpoenas & Commitments','2026-10-30 04:19:47','2026-10-30 04:19:47'),(5,NULL,'P-CG-3088','Danilo','Santos','Aquino','Senior Jail Officer 2 (SJO2)','Custodial / Gate Officer','d.santos@bjmp.gov.ph','+63 920 400 3088','Marites Santos (+63 920 400 3089)','Lower Bicutan, Taguig City','1983-12-08','2009-01-15','active',NULL,'Main Security Gate & Perimeter Guard Commander','2026-10-30 04:19:47','2026-10-30 04:19:47'),(6,NULL,'P-CG-3099','Mark Anthony','Villanueva','Castro','Jail Officer 2 (JO2)','Custodial / Gate Officer','m.villanueva@bjmp.gov.ph','+63 920 400 3099','Lorena Villanueva (+63 920 400 3100)','Sucat, Parañaque City','1992-05-19','2018-09-01','inactive',NULL,'On authorized study leave','2026-10-30 04:19:47','2026-10-30 04:19:47'),(7,NULL,'P-MD-4012','Maria Elena','Bautista','Navarro','Medical Officer III (Dr.)','Medical / Health Officer','e.bautista@bjmp.gov.ph','+63 921 500 4012','Dr. Raul Bautista (+63 921 500 4013)','Alabang, Muntinlupa City','1982-08-30','2015-03-16','active',NULL,'Head Physician, Jail Health and Infirmary Unit','2026-10-30 04:19:47','2026-10-30 04:19:47'),(8,NULL,'P-MD-4018','Janice','Morales','Perez','Jail Nurse (JO2)','Medical / Health Officer','j.morales@bjmp.gov.ph','+63 921 500 4018','Carlos Morales (+63 921 500 4019)','Poblacion, Makati City','1991-04-12','2019-07-22','locked',NULL,'Account temporarily locked by security policy','2026-10-30 04:19:47','2026-10-30 04:19:47');
/*!40000 ALTER TABLE `personnel_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','personnel') NOT NULL DEFAULT 'admin',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `status` enum('active','inactive','locked') NOT NULL DEFAULT 'active',
  `failed_attempts` int(11) DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Captain Arthur M. Reyes','admin@jms.gov.ph','$2b$10$VuKHp2VOQWT6hNwS04rLu.FOZdS7LFGRarX6tqgkbLw/8KM4bLjuK','admin','2026-10-30 04:19:47','2026-10-30 04:19:47','active',0,NULL,'2026-10-30 04:19:47','127.0.0.1','+63 917 888 1234','/images/admin-avatar.png');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'myAdmin'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-30 12:20:01
