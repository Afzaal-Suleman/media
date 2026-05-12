create table chapters (
    id uuid default gen_random_uuid() primary key,
    book_id uuid references books(id) on delete cascade,
    chapter_number int,
    title text,
    content text,
    summary text,
    chapter_notes text,
    chapter_notes_status text,
    status text default 'pending',
    created_at timestamp default now()
);