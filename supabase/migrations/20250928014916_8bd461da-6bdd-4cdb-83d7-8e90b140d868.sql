INSERT INTO user_roles (user_id, role) 
VALUES ('e64ec1e6-d220-4f4b-80fe-dffcae7f9a08', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;