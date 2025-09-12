-- Create guide-related tables for the "拍照即听" feature

-- Table for storing image identification sessions
create table identify_sessions (
  identify_id  varchar primary key,
  device_id    varchar not null,
  lat          double precision,
  lng          double precision,
  accuracy_m   int,
  spot         text,
  confidence   real,
  bbox         jsonb,
  created_at   timestamptz default now()
);

-- Table for storing generated guide narratives
create table guides (
  guide_id     varchar primary key,
  device_id    varchar,
  spot         text,
  title        text,
  confidence   real,
  transcript   text,
  duration_ms  int,
  created_at   timestamptz default now()
);

-- Table for storing audio segments of guides
create table guide_segments (
  guide_id     varchar,
  seq          int,
  start_ms     int,
  end_ms       int,
  format       varchar(8),
  bitrate_kbps int,
  bytes_len    int,
  object_key   text,
  primary key (guide_id, seq)
);

-- Create index for efficient querying of guide segments
create index on guide_segments(guide_id);

-- Create storage bucket for audio segments (public for client access)
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'audio-seg') then
    insert into storage.buckets (id, name, public) values ('audio-seg', 'audio-seg', true);
  end if;
end $$;

-- Add foreign key constraints if needed (optional, depends on your requirements)
-- alter table identify_sessions add constraint fk_identify_device foreign key (device_id) references devices(id);
-- alter table guides add constraint fk_guide_device foreign key (device_id) references devices(id);
-- alter table guide_segments add constraint fk_segment_guide foreign key (guide_id) references guides(guide_id);
