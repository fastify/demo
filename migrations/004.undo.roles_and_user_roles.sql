ALTER TABLE users
DROP FOREIGN KEY fk_user_role,
DROP COLUMN user_role_id;

DROP TABLE IF EXISTS user_roles;

DROP TABLE IF EXISTS roles;
