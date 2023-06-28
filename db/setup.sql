CREATE TABLE IF NOT EXISTS auth.tokens
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text COLLATE pg_catalog."default" NOT NULL,
    refresh_token text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT tokens_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS auth.tokens
    OWNER to postgres;


CREATE TABLE IF NOT EXISTS auth.users
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text COLLATE pg_catalog."default" NOT NULL,
    username text COLLATE pg_catalog."default" NOT NULL,
    password text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS auth.users
    OWNER to postgres;