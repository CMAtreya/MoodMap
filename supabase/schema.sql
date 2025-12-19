create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamp with time zone default now()
);

create table if not exists itineraries (
  id text primary key,
  user_id uuid references users(id),
  mood text not null,
  time_window_hours integer not null,
  start_lat double precision not null,
  start_lng double precision not null,
  start_timestamp bigint not null,
  narrative text,
  summary jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists itinerary_stops (
  id bigserial primary key,
  itinerary_id text references itineraries(id) on delete cascade,
  order_index integer not null,
  place_id text,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  category text,
  rating double precision,
  reviews integer,
  arrival_time text,
  departure_time text,
  duration_minutes integer,
  travel_minutes integer,
  crowd_level text
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  itinerary_id text references itineraries(id) on delete cascade,
  user_id uuid references users(id),
  current_index integer default 1,
  status text default 'active',
  started_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  state jsonb,
  feedback jsonb
);

create table if not exists trip_events (
  id bigserial primary key,
  trip_id uuid references trips(id) on delete cascade,
  type text not null,
  payload jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists crowd_reports (
  id bigserial primary key,
  itinerary_id text references itineraries(id) on delete cascade,
  stop_order integer not null,
  level text not null,
  user_id uuid references users(id),
  reported_at timestamp with time zone default now()
);

create table if not exists saved_places (
  id bigserial primary key,
  user_id uuid references users(id),
  name text not null,
  lat double precision,
  lng double precision,
  category text,
  rating double precision,
  reviews integer,
  tags text[],
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists user_settings (
  user_id uuid primary key references users(id),
  default_radius_km integer default 5,
  transport_mode text default 'walking',
  accessibility jsonb,
  dietary jsonb,
  notifications jsonb,
  privacy jsonb,
  updated_at timestamp with time zone default now()
);
