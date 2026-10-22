-- Runs once, the first time the Postgres volume is created.
-- The automated tests use this database, so they never touch development content.
CREATE DATABASE noisy_streetss_test;
