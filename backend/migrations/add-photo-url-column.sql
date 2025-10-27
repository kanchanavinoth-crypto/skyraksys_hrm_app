-- Migration to add photoUrl column to employees table
-- Run this script if you have an existing database

ALTER TABLE employees ADD COLUMN photoUrl VARCHAR(500);
