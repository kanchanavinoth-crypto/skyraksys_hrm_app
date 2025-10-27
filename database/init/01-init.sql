-- PostgreSQL initialization script for SkyrakSys HRM
-- This script will run when the PostgreSQL container starts for the first time

-- Create database if not exists (redundant as it's created via env vars, but good practice)
-- CREATE DATABASE IF NOT EXISTS skyraksys_hrm;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create initial admin user (will be handled by Sequelize seeders later)
-- This is just a placeholder for any initial setup needed

COMMENT ON DATABASE skyraksys_hrm IS 'SkyrakSys HRM System Database - Production Ready PostgreSQL';
