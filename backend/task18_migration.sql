-- Task 18: add profile picture path to users
ALTER TABLE users
ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL;
