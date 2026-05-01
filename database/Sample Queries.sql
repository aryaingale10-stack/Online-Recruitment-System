-- QUERY 1 – Job Search Feature:

SELECT jp.job_id, jp.title,
       ep.company_name AS employer_name,
       jp.location, jp.salary, jp.status
FROM Job_Posting jp
JOIN Employer_Profile ep
    ON jp.employer_id = ep.employer_id
WHERE jp.status = 'Active';

-- QUERY 2 – Application Status Tracking:

SELECT a.application_id,
       u.name AS job_seeker,
       jp.title AS job_title,
       ep.company_name,
       a.application_date, a.status
FROM Application a
JOIN Users u ON a.seeker_id = u.user_id
JOIN Job_Posting jp ON a.job_id = jp.job_id
JOIN Employer_Profile ep 
    ON jp.employer_id = ep.employer_id
WHERE a.seeker_id IN (4, 5);

-- QUERY 3 – Interview Schedule Viewer:

SELECT i.interview_id, u.name AS candidate_name,
       jp.title AS job_title,
       ep.company_name AS employer,
       i.date_time AS scheduled_at,
       i.mode, i.feedback, i.result AS outcome
FROM Interview i
JOIN Application a ON i.application_id = a.application_id
JOIN Users u ON a.seeker_id = u.user_id
JOIN Job_Posting jp ON a.job_id = jp.job_id
JOIN Employer_Profile ep 
    ON jp.employer_id = ep.employer_id
WHERE a.seeker_id = 11
ORDER BY i.date_time ASC;

-- QUERY 4 – Admin Views All Users & Roles:

SELECT u.user_id, u.name AS full_name,
       u.email, r.role_name AS user_role
FROM Users u
JOIN Role r ON u.role_id = r.role_id
ORDER BY r.role_name ASC, u.name ASC;

-- QUERY 5 – Application Count per Job Posting:

SELECT jp.job_id, jp.title AS job_title,
       ep.company_name AS employer,
       jp.status AS posting_status,
       COUNT(a.application_id) AS total_applications,
       SUM(CASE WHEN a.status = 'Shortlisted' 
           THEN 1 ELSE 0 END) AS shortlisted,
       SUM(CASE WHEN a.status = 'Hired' 
           THEN 1 ELSE 0 END) AS hired,
       SUM(CASE WHEN a.status = 'Rejected' 
           THEN 1 ELSE 0 END) AS rejected
FROM Job_Posting jp
JOIN Employer_Profile ep 
    ON jp.employer_id = ep.employer_id
LEFT JOIN Application a ON jp.job_id = a.job_id
GROUP BY jp.job_id, jp.title, 
         ep.company_name, jp.status
ORDER BY total_applications DESC;

