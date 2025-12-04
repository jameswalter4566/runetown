-- Check if there's a view overriding the users table
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'users';

-- Check for views
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views
WHERE viewname = 'users';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- If you need to access the table directly, you can create a function
CREATE OR REPLACE FUNCTION public.create_game_user(
    p_username TEXT,
    p_wallet_public_key TEXT,
    p_wallet_private_key TEXT,
    p_token_mint_address TEXT,
    p_character_model TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_result json;
BEGIN
    -- Insert directly into the users table
    INSERT INTO public.users (
        username,
        wallet_public_key,
        wallet_private_key,
        token_mint_address,
        character_model
    )
    VALUES (
        p_username,
        p_wallet_public_key,
        p_wallet_private_key,
        p_token_mint_address,
        p_character_model
    )
    RETURNING id INTO v_user_id;
    
    -- Return the created user data
    SELECT json_build_object(
        'id', id,
        'username', username,
        'wallet_public_key', wallet_public_key,
        'token_mint_address', token_mint_address,
        'character_model', character_model
    ) INTO v_result
    FROM public.users
    WHERE id = v_user_id;
    
    RETURN v_result;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Username already exists';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating user: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_game_user TO anon, authenticated;