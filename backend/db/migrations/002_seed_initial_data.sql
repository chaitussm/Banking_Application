-- 002_seed_initial_data.sql
-- Seeds the database with initial data for the banking application

INSERT INTO users (username, email, password_hash) VALUES
    ('alice', 'alice@example.com', 'hashed_password_1'),
    ('bob', 'bob@example.com', 'hashed_password_2');

INSERT INTO accounts (user_id, account_number, balance) VALUES
    (1, 'ACC1001', 1000.00),
    (2, 'ACC1002', 1500.00);

INSERT INTO transactions (account_id, type, amount, description) VALUES
    (1, 'deposit', 1000.00, 'Initial deposit'),
    (2, 'deposit', 1500.00, 'Initial deposit');
