-- TOPLOLIPOP — Schéma initial de base de données
-- Cloudflare D1 (SQLite compatible)

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
  tags TEXT DEFAULT '[]',
  child_birthdays TEXT DEFAULT '[]',
  partner_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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
  checklist TEXT DEFAULT '[]',
  color TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'available',
  condition TEXT DEFAULT 'good',
  photos TEXT DEFAULT '[]',
  purchase_date TEXT,
  purchase_price REAL,
  rental_price REAL,
  deposit_amount REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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
  deposit_returned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL
);

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
  skills TEXT DEFAULT '[]',
  languages TEXT DEFAULT '[]',
  experience TEXT,
  hourly_rate REAL,
  notes TEXT,
  documents TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS availabilities (
  id TEXT PRIMARY KEY,
  collaborator_id TEXT NOT NULL REFERENCES collaborators(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  available INTEGER DEFAULT 1,
  type TEXT DEFAULT 'regular',
  notes TEXT,
  created_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  number TEXT,
  status TEXT DEFAULT 'draft',
  title TEXT,
  items TEXT DEFAULT '[]',
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

CREATE TABLE IF NOT EXISTS pricing (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  unit TEXT DEFAULT 'hour',
  conditions TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  commission_rate REAL DEFAULT 0,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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
