-- RHEL 9.6 Production Database Triggers Script
-- Skyraksys HRM System - Triggers and Functions
-- Run after 02_create_indexes.sql

\c skyraksys_hrm_prod;

-- ==============================================
-- UTILITY FUNCTIONS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), COALESCE(current_setting('app.current_user_id', true)::integer, 0));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), COALESCE(current_setting('app.current_user_id', true)::integer, 0));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), COALESCE(current_setting('app.current_user_id', true)::integer, 0));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to validate salary structure dates
CREATE OR REPLACE FUNCTION validate_salary_structure_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping salary structures for the same employee
    IF EXISTS (
        SELECT 1 FROM salary_structures 
        WHERE employee_id = NEW.employee_id 
        AND id != COALESCE(NEW.id, 0)
        AND is_active = true
        AND (
            (NEW.effective_from BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31'))
            OR
            (COALESCE(NEW.effective_to, '9999-12-31') BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31'))
            OR
            (NEW.effective_from <= effective_from AND COALESCE(NEW.effective_to, '9999-12-31') >= COALESCE(effective_to, '9999-12-31'))
        )
    ) THEN
        RAISE EXCEPTION 'Overlapping salary structure dates for employee %', NEW.employee_id;
    END IF;
    
    -- Ensure effective_to is after effective_from
    IF NEW.effective_to IS NOT NULL AND NEW.effective_to <= NEW.effective_from THEN
        RAISE EXCEPTION 'Effective to date must be after effective from date';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to validate payslip uniqueness
CREATE OR REPLACE FUNCTION validate_payslip_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for existing payslip for same employee, month, year
    IF EXISTS (
        SELECT 1 FROM payslips 
        WHERE employee_id = NEW.employee_id 
        AND month = NEW.month 
        AND year = NEW.year 
        AND id != COALESCE(NEW.id, 0)
    ) THEN
        RAISE EXCEPTION 'Payslip already exists for employee % for month % year %', NEW.employee_id, NEW.month, NEW.year;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to validate leave dates
CREATE OR REPLACE FUNCTION validate_leave_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure end_date is after start_date
    IF NEW.end_date < NEW.start_date THEN
        RAISE EXCEPTION 'Leave end date must be after start date';
    END IF;
    
    -- Calculate total days
    NEW.total_days = NEW.end_date - NEW.start_date + 1;
    
    -- Check for overlapping leaves for the same employee
    IF EXISTS (
        SELECT 1 FROM leaves 
        WHERE employee_id = NEW.employee_id 
        AND id != COALESCE(NEW.id, 0)
        AND status NOT IN ('rejected', 'cancelled')
        AND (
            (NEW.start_date BETWEEN start_date AND end_date)
            OR
            (NEW.end_date BETWEEN start_date AND end_date)
            OR
            (NEW.start_date <= start_date AND NEW.end_date >= end_date)
        )
    ) THEN
        RAISE EXCEPTION 'Overlapping leave dates for employee %', NEW.employee_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update project status based on tasks
CREATE OR REPLACE FUNCTION update_project_status()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    project_status VARCHAR(20);
BEGIN
    -- Get task counts for the project
    SELECT COUNT(*), COUNT(CASE WHEN status = 'completed' THEN 1 END)
    INTO total_tasks, completed_tasks
    FROM tasks 
    WHERE project_id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.project_id 
        ELSE NEW.project_id 
    END;
    
    -- Determine new project status
    IF total_tasks = 0 THEN
        project_status = 'active';
    ELSIF completed_tasks = total_tasks THEN
        project_status = 'completed';
    ELSE
        project_status = 'active';
    END IF;
    
    -- Update project status
    UPDATE projects 
    SET status = project_status
    WHERE id = CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.project_id 
        ELSE NEW.project_id 
    END;
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ language 'plpgsql';

-- Function to calculate attendance hours
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total hours if both check_in and check_out are provided
    IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
        NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600;
        
        -- Calculate overtime (assuming 8 hours is standard work day)
        IF NEW.total_hours > 8 THEN
            NEW.overtime_hours = NEW.total_hours - 8;
        ELSE
            NEW.overtime_hours = 0;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================
-- UPDATED_AT TRIGGERS
-- ==============================================

-- Users table
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Employees table
CREATE TRIGGER trigger_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Departments table
CREATE TRIGGER trigger_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Positions table
CREATE TRIGGER trigger_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Payslip templates table
CREATE TRIGGER trigger_payslip_templates_updated_at
    BEFORE UPDATE ON payslip_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Salary structures table
CREATE TRIGGER trigger_salary_structures_updated_at
    BEFORE UPDATE ON salary_structures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Payroll data table
CREATE TRIGGER trigger_payroll_data_updated_at
    BEFORE UPDATE ON payroll_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Payslips table
CREATE TRIGGER trigger_payslips_updated_at
    BEFORE UPDATE ON payslips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Attendance table
CREATE TRIGGER trigger_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Leaves table
CREATE TRIGGER trigger_leaves_updated_at
    BEFORE UPDATE ON leaves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Projects table
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tasks table
CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Timesheets table
CREATE TRIGGER trigger_timesheets_updated_at
    BEFORE UPDATE ON timesheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- AUDIT LOG TRIGGERS
-- ==============================================

-- Users audit
CREATE TRIGGER trigger_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- Employees audit
CREATE TRIGGER trigger_employees_audit
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- Payslips audit (important for financial records)
CREATE TRIGGER trigger_payslips_audit
    AFTER INSERT OR UPDATE OR DELETE ON payslips
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- Salary structures audit
CREATE TRIGGER trigger_salary_structures_audit
    AFTER INSERT OR UPDATE OR DELETE ON salary_structures
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- Payroll data audit
CREATE TRIGGER trigger_payroll_data_audit
    AFTER INSERT OR UPDATE OR DELETE ON payroll_data
    FOR EACH ROW
    EXECUTE FUNCTION create_audit_log();

-- ==============================================
-- VALIDATION TRIGGERS
-- ==============================================

-- Salary structure validation
CREATE TRIGGER trigger_validate_salary_structure_dates
    BEFORE INSERT OR UPDATE ON salary_structures
    FOR EACH ROW
    EXECUTE FUNCTION validate_salary_structure_dates();

-- Payslip uniqueness validation
CREATE TRIGGER trigger_validate_payslip_uniqueness
    BEFORE INSERT OR UPDATE ON payslips
    FOR EACH ROW
    EXECUTE FUNCTION validate_payslip_uniqueness();

-- Leave validation
CREATE TRIGGER trigger_validate_leave_dates
    BEFORE INSERT OR UPDATE ON leaves
    FOR EACH ROW
    EXECUTE FUNCTION validate_leave_dates();

-- Attendance hours calculation
CREATE TRIGGER trigger_calculate_attendance_hours
    BEFORE INSERT OR UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION calculate_attendance_hours();

-- ==============================================
-- BUSINESS LOGIC TRIGGERS
-- ==============================================

-- Project status update based on tasks
CREATE TRIGGER trigger_update_project_status_on_task_change
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_status();

-- ==============================================
-- HELPER FUNCTIONS FOR PAYROLL CALCULATIONS
-- ==============================================

-- Function to calculate PF (Provident Fund)
CREATE OR REPLACE FUNCTION calculate_pf(basic_salary DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    -- PF is 12% of basic salary, capped at 1800 (for basic > 15000)
    IF basic_salary > 15000 THEN
        RETURN 1800;
    ELSE
        RETURN ROUND(basic_salary * 0.12, 2);
    END IF;
END;
$$ language 'plpgsql';

-- Function to calculate ESIC (Employee State Insurance)
CREATE OR REPLACE FUNCTION calculate_esic(gross_salary DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    -- ESIC is 0.75% of gross salary, applicable if gross <= 21000
    IF gross_salary <= 21000 THEN
        RETURN ROUND(gross_salary * 0.0075, 2);
    ELSE
        RETURN 0;
    END IF;
END;
$$ language 'plpgsql';

-- Function to calculate Professional Tax (varies by state)
CREATE OR REPLACE FUNCTION calculate_professional_tax(gross_salary DECIMAL, state VARCHAR DEFAULT 'MH')
RETURNS DECIMAL AS $$
BEGIN
    -- Maharashtra PT slab
    IF state = 'MH' THEN
        IF gross_salary <= 5000 THEN
            RETURN 0;
        ELSIF gross_salary <= 10000 THEN
            RETURN 150;
        ELSIF gross_salary <= 25000 THEN
            RETURN 200;
        ELSE
            RETURN 200;
        END IF;
    ELSE
        -- Default PT calculation for other states
        IF gross_salary <= 10000 THEN
            RETURN 0;
        ELSE
            RETURN 200;
        END IF;
    END IF;
END;
$$ language 'plpgsql';

-- Function to calculate HRA exemption
CREATE OR REPLACE FUNCTION calculate_hra_exemption(basic_salary DECIMAL, hra_received DECIMAL, rent_paid DECIMAL, metro_city BOOLEAN DEFAULT false)
RETURNS DECIMAL AS $$
DECLARE
    exemption1 DECIMAL;
    exemption2 DECIMAL;
    exemption3 DECIMAL;
BEGIN
    -- HRA exemption is minimum of:
    -- 1. Actual HRA received
    exemption1 = hra_received;
    
    -- 2. 50% of basic (metro) or 40% of basic (non-metro)
    IF metro_city THEN
        exemption2 = basic_salary * 0.50;
    ELSE
        exemption2 = basic_salary * 0.40;
    END IF;
    
    -- 3. Rent paid - 10% of basic
    exemption3 = GREATEST(rent_paid - (basic_salary * 0.10), 0);
    
    -- Return minimum of all three
    RETURN LEAST(exemption1, exemption2, exemption3);
END;
$$ language 'plpgsql';

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
\echo 'Database triggers and functions created successfully!'
\echo 'Next step: Run 04_insert_sample_data.sql'