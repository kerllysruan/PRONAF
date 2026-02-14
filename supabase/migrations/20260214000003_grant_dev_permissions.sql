-- Grant permission to test users for development/testing
-- This allows specific users to delete proposals during testing/development.

UPDATE user_permissions
SET can_delete_proposals = true
WHERE user_id IN (
    -- You can add user IDs manually here or target by email if you join auth.users
    '506c79fa-8285-4c49-9d4d-380789c34a47', -- kerllysruan88@gmail.com
    '80ed0958-1e70-456a-9cbb-af6d18713881', -- j@gmail.com
    '58f314c3-865e-4953-863a-6893a2f2a889'  -- jfs@gmail.com
);
