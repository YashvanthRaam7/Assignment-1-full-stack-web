CREATE DATABASE IF NOT EXISTS fullstack_app;
USE fullstack_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100)  NOT NULL,
    age            INT           NOT NULL,
    address        TEXT          NOT NULL,
    email          VARCHAR(150)  NOT NULL UNIQUE,
    mobile         VARCHAR(15)   NOT NULL,
    password_hash  VARCHAR(255)  NOT NULL,
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Uploaded files metadata
CREATE TABLE IF NOT EXISTS uploaded_files (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT           NOT NULL,
    filename         VARCHAR(255)  NOT NULL,
    file_type        VARCHAR(10)   NOT NULL,
    upload_timestamp TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
