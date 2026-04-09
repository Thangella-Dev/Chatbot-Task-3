create table if not exists knowledge (
  id bigserial primary key,
  question text not null,
  question_norm text not null unique,
  answer text not null,
  created_at timestamptz not null default now()
);

