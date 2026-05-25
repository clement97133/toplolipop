-- TOPLOLIPOP — Schéma Supabase (PostgreSQL)
-- À coller dans : Supabase Dashboard → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  event_address TEXT,
  notes TEXT,
  preferences TEXT,
  tags JSONB DEFAULT '[]',
  child_birthdays JSONB DEFAULT '[]',
  partner_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  theme TEXT,
  child_count INTEGER DEFAULT 0,
  instructions TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  checklist JSONB DEFAULT '[]',
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'available',
  condition TEXT DEFAULT 'good',
  photos JSONB DEFAULT '[]',
  purchase_date TEXT,
  purchase_price REAL,
  rental_price REAL,
  deposit_amount REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS equipment_rentals (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  equipment_id TEXT REFERENCES equipment(id),
  quantity INTEGER DEFAULT 1,
  delivery_datetime TEXT,
  pickup_datetime TEXT,
  condition_before TEXT,
  condition_after TEXT,
  deposit_amount REAL DEFAULT 0,
  deposit_returned BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TEXT NOT NULL
);
ALTER TABLE equipment_rentals DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS collaborators (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  photo TEXT,
  role TEXT NOT NULL DEFAULT 'other',
  status TEXT DEFAULT 'active',
  skills JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  experience TEXT,
  hourly_rate REAL,
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE collaborators DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS availabilities (
  id TEXT PRIMARY KEY,
  collaborator_id TEXT NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  available BOOLEAN DEFAULT TRUE,
  type TEXT DEFAULT 'regular',
  notes TEXT,
  created_at TEXT NOT NULL
);
ALTER TABLE availabilities DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  collaborator_id TEXT NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  start_time TEXT,
  end_time TEXT,
  rate REAL,
  status TEXT DEFAULT 'assigned',
  evaluation INTEGER,
  evaluation_notes TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  number TEXT,
  status TEXT DEFAULT 'draft',
  title TEXT,
  items JSONB DEFAULT '[]',
  subtotal REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  notes TEXT,
  valid_until TEXT,
  due_date TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS pricing (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  unit TEXT DEFAULT 'hour',
  conditions TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE pricing DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  commission_rate REAL DEFAULT 0,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_events_client ON events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_rentals_event ON equipment_rentals(event_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_collab ON availabilities(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_assignments_event ON assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_assignments_collab ON assignments(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
