-- ==========================================
-- AGON — Database Migration v1
-- Jalankan di Supabase SQL Editor
-- ==========================================

-- 1. MASTER DATA
CREATE TABLE IF NOT EXISTS institutions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  contact    TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category_params (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type  TEXT NOT NULL CHECK (type IN ('gender', 'level', 'scoring')),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  UNIQUE(type, value)
);

-- Template Kriteria
CREATE TABLE IF NOT EXISTS criteria_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS criteria_template_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES criteria_templates(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  max_score   NUMERIC DEFAULT 100,
  weight      NUMERIC DEFAULT 1,
  order_num   INTEGER DEFAULT 0
);

-- 2. LOMBA
CREATE TABLE IF NOT EXISTS competitions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  gender       TEXT NOT NULL,
  level        TEXT NOT NULL,
  scoring_type TEXT NOT NULL CHECK (scoring_type IN ('point', 'bracket')),
  is_group     BOOLEAN DEFAULT FALSE,
  quota        INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'open' CHECK (status IN ('open','closed','finished')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competition_criteria (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  max_score      NUMERIC DEFAULT 100,
  weight         NUMERIC DEFAULT 1,
  order_num      INTEGER DEFAULT 0
);

-- 3. PESERTA
CREATE TABLE IF NOT EXISTS participants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  gender         TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  grade          TEXT,
  is_group       BOOLEAN DEFAULT FALSE,
  team_name      TEXT,
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  registered_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, participant_id)
);

-- 4. PENJURIAN
CREATE TABLE IF NOT EXISTS score_details (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  criteria_id    UUID REFERENCES competition_criteria(id) ON DELETE CASCADE,
  judge_id       UUID REFERENCES auth.users(id),
  score          NUMERIC DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, criteria_id, judge_id)
);

-- Aggregated total score per peserta per lomba
CREATE TABLE IF NOT EXISTS scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  total_score    NUMERIC DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, participant_id)
);

-- 5. BRACKET
CREATE TABLE IF NOT EXISTS brackets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  round          INTEGER NOT NULL,
  match_number   INTEGER NOT NULL,
  participant_a  UUID REFERENCES participants(id),
  participant_b  UUID REFERENCES participants(id),
  winner_id      UUID REFERENCES participants(id),
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','ongoing','done')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SEED: Default Category Params
-- ==========================================
INSERT INTO category_params (type, value, label) VALUES
  ('gender', 'male',   'Putra'),
  ('gender', 'female', 'Putri'),
  ('gender', 'mixed',  'Campuran'),
  ('level',  'sd',     'SD'),
  ('level',  'smp',    'SMP'),
  ('level',  'sma',    'SMA'),
  ('level',  'umum',   'Umum'),
  ('scoring','point',  'Sistem Poin'),
  ('scoring','bracket','Sistem Babak/Bracket')
ON CONFLICT (type, value) DO NOTHING;

-- ==========================================
-- TRIGGER: Auto-recalculate total_score
-- ==========================================
CREATE OR REPLACE FUNCTION recalculate_total_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(
    sd.score * cc.weight / cc.max_score * 100
  ) / NULLIF(SUM(cc.weight), 0), 0)
  INTO v_total
  FROM score_details sd
  JOIN competition_criteria cc ON cc.id = sd.criteria_id
  WHERE sd.participant_id = NEW.participant_id
    AND sd.competition_id = NEW.competition_id;

  INSERT INTO scores (competition_id, participant_id, total_score, updated_at)
  VALUES (NEW.competition_id, NEW.participant_id, v_total, NOW())
  ON CONFLICT (competition_id, participant_id)
  DO UPDATE SET total_score = v_total, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_recalculate_score
AFTER INSERT OR UPDATE ON score_details
FOR EACH ROW EXECUTE FUNCTION recalculate_total_score();

-- ==========================================
-- ENABLE REALTIME
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE scores;
ALTER PUBLICATION supabase_realtime ADD TABLE brackets;
ALTER PUBLICATION supabase_realtime ADD TABLE score_details;
