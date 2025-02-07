/*
  # Create students table for user management

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `ern_number` (text, unique) - Enrollment number
      - `name` (text) - Student's full name
      - `email` (text, unique) - College email
      - `branch` (text) - Department
      - `batch_year` (integer) - Graduation year
      - `section` (text) - Class section
      - `mobile_number` (text) - Contact number
      - `password` (text) - Hashed temporary password
      - `is_password_changed` (boolean) - Track first login
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `students` table
    - Add policies for:
      - Admin can read all students
      - Students can read their own data
      - Students can update their own password
*/

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ern_number text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  branch text NOT NULL,
  batch_year integer NOT NULL,
  section text NOT NULL,
  mobile_number text,
  password text NOT NULL,
  is_password_changed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin can read all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Students can update own password"
  ON students
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);