create extension if not exists "pgcrypto";

create table books (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    notes_on_outline_before text,
    outline text,
    notes_on_outline_after text,
    status_outline_notes text,
    final_review_notes text,
    final_review_notes_status text,
    book_output_status text default 'pending',
    created_at timestamp default now()
);