import { neon } from '@neondatabase/serverless';

// ---------------------------------------------------------------------------
// Connection helper
// ---------------------------------------------------------------------------

function getSQL() {
  return neon(process.env.DATABASE_URL!);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageViewInput {
  sessionId: string;
  pagePath: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  country?: string;
  city?: string;
  region?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  userId?: number;
}

export interface EventInput {
  sessionId: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  pagePath?: string;
}

export interface SurveyInput {
  sessionId: string;
  ageRange?: string;
  gender?: string;
  interest?: string;
}

// ---------------------------------------------------------------------------
// Overview stats
// ---------------------------------------------------------------------------

export interface OverviewStats {
  total_views: number;
  unique_visitors: number;
  today_views: number;
  today_visitors: number;
}

// ---------------------------------------------------------------------------
// Insert helpers
// ---------------------------------------------------------------------------

export async function insertPageView(data: PageViewInput) {
  const sql = getSQL();
  await sql`
    INSERT INTO page_views (
      session_id, page_path, referrer, user_agent, ip,
      country, city, region, device_type, browser, os,
      screen_width, screen_height, language, user_id
    ) VALUES (
      ${data.sessionId},
      ${data.pagePath},
      ${data.referrer ?? ''},
      ${data.userAgent ?? ''},
      ${data.ip ?? ''},
      ${data.country ?? ''},
      ${data.city ?? ''},
      ${data.region ?? ''},
      ${data.deviceType ?? ''},
      ${data.browser ?? ''},
      ${data.os ?? ''},
      ${data.screenWidth ?? 0},
      ${data.screenHeight ?? 0},
      ${data.language ?? ''},
      ${data.userId ?? null}
    )
  `;
}

export async function insertEvent(data: EventInput) {
  const sql = getSQL();
  await sql`
    INSERT INTO analytics_events (
      session_id, event_type, event_data, page_path
    ) VALUES (
      ${data.sessionId},
      ${data.eventType},
      ${JSON.stringify(data.eventData ?? {})},
      ${data.pagePath ?? ''}
    )
  `;
}

export async function insertSurvey(data: SurveyInput) {
  const sql = getSQL();
  await sql`
    INSERT INTO user_surveys (session_id, age_range, gender, interest)
    VALUES (
      ${data.sessionId},
      ${data.ageRange ?? ''},
      ${data.gender ?? ''},
      ${data.interest ?? ''}
    )
    ON CONFLICT (session_id) DO NOTHING
  `;
}

// ---------------------------------------------------------------------------
// Stats query helpers
// ---------------------------------------------------------------------------

function getStartDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function getOverviewStats(days: number = 30): Promise<OverviewStats> {
  const sql = getSQL();
  const startDate = getStartDate(days);

  const rows = await sql`
    SELECT
      COUNT(*)::int                                          AS total_views,
      COUNT(DISTINCT session_id)::int                        AS unique_visitors,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today_views,
      COUNT(DISTINCT session_id) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today_visitors
    FROM page_views
    WHERE created_at >= ${startDate}
  `;

  return rows[0] as OverviewStats;
}

export async function getDailyTrend(days: number = 30) {
  const sql = getSQL();
  const startDate = getStartDate(days);

  const rows = await sql`
    SELECT
      DATE(created_at AT TIME ZONE 'Asia/Seoul') AS date,
      COUNT(*)::int                              AS views,
      COUNT(DISTINCT session_id)::int            AS visitors
    FROM page_views
    WHERE created_at >= ${startDate}
    GROUP BY date
    ORDER BY date
  `;

  return rows as { date: string; views: number; visitors: number }[];
}

export async function getPageStats(days: number = 30) {
  const sql = getSQL();
  const startDate = getStartDate(days);

  const rows = await sql`
    SELECT
      page_path,
      COUNT(*)::int                   AS views,
      COUNT(DISTINCT session_id)::int AS visitors
    FROM page_views
    WHERE created_at >= ${startDate}
    GROUP BY page_path
    ORDER BY views DESC
    LIMIT 20
  `;

  return rows as { page_path: string; views: number; visitors: number }[];
}

export async function getDeviceStats(days: number = 30) {
  const sql = getSQL();
  const startDate = getStartDate(days);

  const rows = await sql`
    SELECT device_type, COUNT(*)::int AS count
    FROM page_views
    WHERE created_at >= ${startDate}
    GROUP BY device_type
  `;

  return rows as { device_type: string; count: number }[];
}

export async function getBrowserStats(days: number = 30) {
  const sql = getSQL();
  const startDate = getStartDate(days);

  const rows = await sql`
    SELECT browser, COUNT(*)::int AS count
    FROM page_views
    WHERE created_at >= ${startDate}
    GROUP BY browser
    ORDER BY count DESC
  `;

  return rows as { browser: string; count: number }[];
}

export async function getOSStats(days: number = 30) {
  const sql = getSQL();
  const startDate = getStartDate(days);

  const rows = await sql`
    SELECT os, COUNT(*)::int AS count
    FROM page_views
    WHERE created_at >= ${startDate}
    GROUP BY os
    ORDER BY count DESC
  `;

  return rows as { os: string; count: number }[];
}

export async function getGeoStats(days: number = 30) {
  const sql = getSQL();
  const startDate = getStartDate(days);

  const rows = await sql`
    SELECT country, city, COUNT(*)::int AS count
    FROM page_views
    WHERE created_at >= ${startDate}
    GROUP BY country, city
    ORDER BY count DESC
    LIMIT 30
  `;

  return rows as { country: string; city: string; count: number }[];
}

export async function getReferrerStats(days: number = 30) {
  const sql = getSQL();
  const startDate = getStartDate(days);

  const rows = await sql`
    SELECT referrer, COUNT(*)::int AS count
    FROM page_views
    WHERE created_at >= ${startDate} AND referrer <> ''
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT 20
  `;

  return rows as { referrer: string; count: number }[];
}

export async function getHourlyHeatmap(days: number = 30) {
  const sql = getSQL();
  const startDate = getStartDate(days);

  const rows = await sql`
    SELECT
      EXTRACT(DOW  FROM created_at AT TIME ZONE 'Asia/Seoul')::int AS dow,
      EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Seoul')::int AS hour,
      COUNT(*)::int AS count
    FROM page_views
    WHERE created_at >= ${startDate}
    GROUP BY dow, hour
    ORDER BY dow, hour
  `;

  return rows as { dow: number; hour: number; count: number }[];
}

export async function getSurveyStats() {
  const sql = getSQL();

  const ageRows = await sql`
    SELECT age_range, COUNT(*)::int AS count
    FROM user_surveys
    WHERE age_range <> ''
    GROUP BY age_range
    ORDER BY age_range
  `;

  const genderRows = await sql`
    SELECT gender, COUNT(*)::int AS count
    FROM user_surveys
    WHERE gender <> ''
    GROUP BY gender
    ORDER BY count DESC
  `;

  return {
    age: ageRows as { age_range: string; count: number }[],
    gender: genderRows as { gender: string; count: number }[],
  };
}

// ---------------------------------------------------------------------------
// Schema initialisation (runs CREATE TABLE IF NOT EXISTS)
// ---------------------------------------------------------------------------

export async function initializeSchema() {
  const sql = getSQL();

  await sql`
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
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id          BIGSERIAL PRIMARY KEY,
      session_id  VARCHAR(36)  NOT NULL,
      event_type  VARCHAR(50)  NOT NULL,
      event_data  JSONB        DEFAULT '{}',
      page_path   VARCHAR(500) DEFAULT '',
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_surveys (
      id         BIGSERIAL PRIMARY KEY,
      session_id VARCHAR(36)  NOT NULL UNIQUE,
      age_range  VARCHAR(20)  DEFAULT '',
      gender     VARCHAR(10)  DEFAULT '',
      interest   VARCHAR(200) DEFAULT '',
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  // Indexes -- page_views
  await sql`CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_views_page_path  ON page_views (page_path)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views (session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_views_country    ON page_views (country)`;

  // Indexes -- analytics_events
  await sql`CREATE INDEX IF NOT EXISTS idx_events_created_at ON analytics_events (created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_session_id ON analytics_events (session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_event_type ON analytics_events (event_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_page_path  ON analytics_events (page_path)`;

  // Indexes -- user_surveys
  await sql`CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON user_surveys (created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_surveys_session_id ON user_surveys (session_id)`;

  // Users table
  await sql`CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname      VARCHAR(50)  NOT NULL,
    age_range     VARCHAR(20)  DEFAULT '',
    gender        VARCHAR(10)  DEFAULT '',
    interest      VARCHAR(200) DEFAULT '',
    created_at    TIMESTAMPTZ  DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;

  // Add user_id column to existing tables
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='user_id') THEN
      ALTER TABLE page_views ADD COLUMN user_id INTEGER;
    END IF;
  END $$`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id)`;
}

// ---------------------------------------------------------------------------
// User types
// ---------------------------------------------------------------------------

export interface UserInput {
  email: string;
  passwordHash: string;
  nickname: string;
  ageRange: string;
  gender: string;
  interest: string;
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  nickname: string;
  age_range: string;
  gender: string;
  interest: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// User CRUD helpers
// ---------------------------------------------------------------------------

export async function createUser(data: UserInput): Promise<UserRow> {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO users (email, password_hash, nickname, age_range, gender, interest)
    VALUES (${data.email}, ${data.passwordHash}, ${data.nickname}, ${data.ageRange}, ${data.gender}, ${data.interest})
    RETURNING *
  `;
  return rows[0] as UserRow;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return (rows[0] as UserRow) || null;
}

export async function getUserById(id: number): Promise<UserRow | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return (rows[0] as UserRow) || null;
}

export async function getUserStats(days: number = 30) {
  const sql = getSQL();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const total = await sql`SELECT COUNT(*) as count FROM users`;
  const recent = await sql`SELECT COUNT(*) as count FROM users WHERE created_at >= ${startDate.toISOString()}`;
  const ageDistribution = await sql`SELECT age_range, COUNT(*) as count FROM users WHERE age_range != '' GROUP BY age_range ORDER BY age_range`;
  const genderDistribution = await sql`SELECT gender, COUNT(*) as count FROM users WHERE gender != '' GROUP BY gender`;
  const loggedInViews = await sql`SELECT COUNT(*) as count FROM page_views WHERE user_id IS NOT NULL AND created_at >= ${startDate.toISOString()}`;
  const totalViews = await sql`SELECT COUNT(*) as count FROM page_views WHERE created_at >= ${startDate.toISOString()}`;

  return {
    totalUsers: Number(total[0]?.count || 0),
    recentUsers: Number(recent[0]?.count || 0),
    ageDistribution: ageDistribution as { age_range: string; count: string }[],
    genderDistribution: genderDistribution as { gender: string; count: string }[],
    loggedInViewRate: Number(totalViews[0]?.count) > 0
      ? (Number(loggedInViews[0]?.count || 0) / Number(totalViews[0]?.count)) * 100
      : 0,
  };
}
