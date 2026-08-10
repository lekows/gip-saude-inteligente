-- ============================================================
-- SCRIPT: Aprovar usuário lekows como Administrador do GIP
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Passo 1: Verificar se o usuário existe em auth.users
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'lekows@gmail.com';

-- Passo 2: Verificar se o perfil já existe em public.profiles
SELECT * FROM public.profiles WHERE email = 'lekows@gmail.com';

-- Passo 3: Criar ou atualizar o perfil como administrador aprovado
-- (Execute APENAS se o Passo 1 retornar um resultado)
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    account_status,
    active,
    created_at,
    updated_at
)
SELECT 
    id,
    email,
    COALESCE(
        NULLIF(TRIM(raw_user_meta_data->>'full_name'), ''),
        'Leonardo Costa'
    ),
    'administrador',
    'aprovado',
    true,
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'lekows@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(
        NULLIF(TRIM(EXCLUDED.full_name), ''),
        public.profiles.full_name,
        'Leonardo Costa'
    ),
    role = 'administrador',
    account_status = 'aprovado',
    active = true,
    updated_at = NOW();

-- Passo 4: Confirmar que o perfil foi criado/atualizado corretamente
SELECT 
    id,
    email,
    full_name,
    role,
    account_status,
    active,
    created_at,
    updated_at
FROM public.profiles
WHERE email = 'lekows@gmail.com';
