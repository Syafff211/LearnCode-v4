-- Optional, validated YouTube metadata for lessons. The video ID is the only
-- value used to construct an embed URL; iframe HTML is never stored.
alter table public.lessons
  add column if not exists youtube_video_id text,
  add column if not exists youtube_video_title text,
  add column if not exists youtube_video_description text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lessons_youtube_video_id_format'
      and conrelid = 'public.lessons'::regclass
  ) then
    alter table public.lessons
      add constraint lessons_youtube_video_id_format
      check (youtube_video_id is null or youtube_video_id ~ '^[A-Za-z0-9_-]{11}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lessons_youtube_video_title_length'
      and conrelid = 'public.lessons'::regclass
  ) then
    alter table public.lessons
      add constraint lessons_youtube_video_title_length
      check (youtube_video_title is null or char_length(youtube_video_title) <= 120);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lessons_youtube_video_description_length'
      and conrelid = 'public.lessons'::regclass
  ) then
    alter table public.lessons
      add constraint lessons_youtube_video_description_length
      check (youtube_video_description is null or char_length(youtube_video_description) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'lessons_youtube_metadata_requires_video'
      and conrelid = 'public.lessons'::regclass
  ) then
    alter table public.lessons
      add constraint lessons_youtube_metadata_requires_video
      check (
        youtube_video_id is not null
        or (youtube_video_title is null and youtube_video_description is null)
      );
  end if;
end;
$$;

comment on column public.lessons.youtube_video_id is
  'Validated 11-character YouTube video ID; never store raw iframe markup.';
