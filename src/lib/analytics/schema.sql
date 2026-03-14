-- Analytics Schema for Budget Visualization Dashboard
-- Run this via the /api/analytics/init endpoint or directly against your Neon database.

CREATE TABLE IF NOT EXISTS page_views (
  id            BIGSERIAL PRIMARY KEY,
  session_id    VARCHAR(36)   NOT NULL,
  page_path     VARCHAR(500)  NOT NULL,
  referrer      VARCHAR(2000) DEFAULT '',
  user_agent    VARCHAR(1000) DEFAULT '',
  ip            VARCHAR(45)   DEFAULT '',
  country       VARCHAR(2)    DEFAULT '',
  city          VARCHAR(200)  DEFAULT '',
  region        VARCHAR(200)  DEFAULT '',
  device_type   VARCHAR(20)   DEFAULT '',
  browser       VARCHAR(50)   DEFAULT '',
  os            VARCHAR(50)   DEFAULT '',
  screen_width  INT           DEFAULT 0,
  screen_height INT           DEFAULT 0,
  language      VARCHAR(10)   DEFAULT '',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id          BIGSERIAL PRIMARY KEY,
  session_id  VARCHAR(36)  NOT NULL,
  event_type  VARCHAR(50)  NOT NULL,
  event_data  JSONB        DEFAULT '{}',
  page_path   VARCHAR(500) DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_surveys (
  id         BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(36)  NOT NULL UNIQUE,
  age_range  VARCHAR(20)  DEFAULT '',
  gender     VARCHAR(10)  DEFAULT '',
  interest   VARCHAR(200) DEFAULT '',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- page_views indexes
CREATE INDEX IF NOT EXISTS idx_page_views_created_at  ON page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path   ON page_views (page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id  ON page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_country     ON page_views (country);

-- analytics_events indexes
CREATE INDEX IF NOT EXISTS idx_events_created_at  ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_events_session_id  ON analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type  ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_page_path   ON analytics_events (page_path);

-- user_surveys indexes
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON user_surveys (created_at);
CREATE INDEX IF NOT EXISTS idx_surveys_session_id ON user_surveys (session_id);
