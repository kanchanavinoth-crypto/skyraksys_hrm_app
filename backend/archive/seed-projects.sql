-- Project seeding SQL for HRM system
-- Execute with: sqlite3 database.sqlite < seed-projects.sql

INSERT INTO projects (id, name, description, status, createdAt, updatedAt) VALUES ('0d139f82-6a44-48ee-91f7-a676aca5cbbe', 'HRM System Development', 'Main HRM system development and enhancement', 'active', datetime('now'), datetime('now'));
INSERT INTO projects (id, name, description, status, createdAt, updatedAt) VALUES ('2fdabf7f-0185-4bf2-8d62-32c52ffe1f8e', 'Frontend Development', 'React-based user interface development', 'active', datetime('now'), datetime('now'));
INSERT INTO projects (id, name, description, status, createdAt, updatedAt) VALUES ('d3074622-c228-44c8-9960-9ccc54db4815', 'Backend API Development', 'REST API and database development', 'active', datetime('now'), datetime('now'));
INSERT INTO projects (id, name, description, status, createdAt, updatedAt) VALUES ('75890f7a-2cd7-454b-a116-7ef640f5588f', 'Business Process Automation', 'HR workflow automation and optimization', 'active', datetime('now'), datetime('now'));
INSERT INTO projects (id, name, description, status, createdAt, updatedAt) VALUES ('6176a5dd-2baa-4baf-82c7-a82e85846c39', 'Quality Assurance', 'Testing and quality assurance activities', 'active', datetime('now'), datetime('now'));

-- Verify projects were created
SELECT * FROM projects;
