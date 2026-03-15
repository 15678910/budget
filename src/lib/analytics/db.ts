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

  // Users table
  await sql`CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) DEFAULT '',
    nickname      VARCHAR(50)  NOT NULL,
    google_id     VARCHAR(255) DEFAULT '',
    birthdate     VARCHAR(10)  DEFAULT '',
    address       VARCHAR(500) DEFAULT '',
    interest      VARCHAR(200) DEFAULT '',
    created_at    TIMESTAMPTZ  DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;

  // Migration: allow Google OAuth users (no password)
  await sql`ALTER TABLE users ALTER COLUMN password_hash SET DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT ''`;

  // Migrate existing users table: add birthdate/address columns if they don't exist
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='birthdate') THEN
      ALTER TABLE users ADD COLUMN birthdate VARCHAR(10) DEFAULT '';
    END IF;
  END $$`;
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address') THEN
      ALTER TABLE users ADD COLUMN address VARCHAR(500) DEFAULT '';
    END IF;
  END $$`;

  // Add user_id column to existing tables
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='user_id') THEN
      ALTER TABLE page_views ADD COLUMN user_id INTEGER;
    END IF;
  END $$`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id)`;

  // Votes table
  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id             SERIAL PRIMARY KEY,
      budget_item_id VARCHAR(500) NOT NULL,
      vote_type      VARCHAR(20)  NOT NULL,
      user_id        INTEGER REFERENCES users(id),
      session_id     VARCHAR(100),
      created_at     TIMESTAMPTZ  DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_votes_item ON votes(budget_item_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id)`;
}

// ---------------------------------------------------------------------------
// User types
// ---------------------------------------------------------------------------

export interface UserInput {
  email: string;
  passwordHash: string;
  nickname: string;
  birthdate: string;
  address: string;
  interest: string;
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  nickname: string;
  google_id: string;
  birthdate: string;
  address: string;
  interest: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// User CRUD helpers
// ---------------------------------------------------------------------------

export async function createUser(data: UserInput): Promise<UserRow> {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO users (email, password_hash, nickname, birthdate, address, interest)
    VALUES (${data.email}, ${data.passwordHash}, ${data.nickname}, ${data.birthdate}, ${data.address}, ${data.interest})
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

export async function createOrGetGoogleUser(data: {
  email: string;
  nickname: string;
  googleId: string;
}): Promise<UserRow> {
  const sql = getSQL();
  // Check if user already exists
  const existing = await sql`SELECT * FROM users WHERE email = ${data.email} LIMIT 1`;
  if (existing[0]) {
    // Update google_id if not set
    if (!(existing[0] as UserRow).google_id) {
      await sql`UPDATE users SET google_id = ${data.googleId} WHERE id = ${(existing[0] as UserRow).id}`;
    }
    return existing[0] as UserRow;
  }
  // Create new user
  const rows = await sql`
    INSERT INTO users (email, password_hash, nickname, google_id, birthdate, address, interest)
    VALUES (${data.email}, '', ${data.nickname}, ${data.googleId}, '', '', '')
    RETURNING *
  `;
  return rows[0] as UserRow;
}

// ---------------------------------------------------------------------------
// Votes helpers
// ---------------------------------------------------------------------------

export async function castVote(
  budgetItemId: string,
  voteType: string,
  userId?: number,
  sessionId?: string,
): Promise<void> {
  const sql = getSQL();
  if (userId) {
    const existing = await sql`
      SELECT id FROM votes WHERE budget_item_id = ${budgetItemId} AND user_id = ${userId} LIMIT 1
    `;
    if (existing.length > 0) {
      await sql`
        UPDATE votes SET vote_type = ${voteType} WHERE budget_item_id = ${budgetItemId} AND user_id = ${userId}
      `;
      return;
    }
  }
  await sql`
    INSERT INTO votes (budget_item_id, vote_type, user_id, session_id)
    VALUES (${budgetItemId}, ${voteType}, ${userId ?? null}, ${sessionId ?? null})
  `;
}

export async function getVoteCounts(budgetItemId: string): Promise<Record<string, number>> {
  const sql = getSQL();
  const rows = await sql`
    SELECT vote_type, COUNT(*)::int AS count
    FROM votes
    WHERE budget_item_id = ${budgetItemId}
    GROUP BY vote_type
  `;
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.vote_type as string] = row.count as number;
  }
  return counts;
}

export async function getUserVote(budgetItemId: string, userId: number): Promise<string | null> {
  const sql = getSQL();
  const rows = await sql`
    SELECT vote_type FROM votes WHERE budget_item_id = ${budgetItemId} AND user_id = ${userId} LIMIT 1
  `;
  return rows.length > 0 ? (rows[0].vote_type as string) : null;
}

export async function updateUserNickname(id: number, nickname: string): Promise<void> {
  const sql = getSQL();
  await sql`UPDATE users SET nickname = ${nickname} WHERE id = ${id}`;
}

export async function getUserStats(days: number = 30) {
  const sql = getSQL();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const total = await sql`SELECT COUNT(*) as count FROM users`;
  const recent = await sql`SELECT COUNT(*) as count FROM users WHERE created_at >= ${startDate.toISOString()}`;
  const ageDistribution = await sql`
    SELECT
      CASE
        WHEN AGE(CURRENT_DATE, birthdate::date) < INTERVAL '20 years' THEN '10대'
        WHEN AGE(CURRENT_DATE, birthdate::date) < INTERVAL '30 years' THEN '20대'
        WHEN AGE(CURRENT_DATE, birthdate::date) < INTERVAL '40 years' THEN '30대'
        WHEN AGE(CURRENT_DATE, birthdate::date) < INTERVAL '50 years' THEN '40대'
        WHEN AGE(CURRENT_DATE, birthdate::date) < INTERVAL '60 years' THEN '50대'
        ELSE '60대 이상'
      END AS age_range,
      COUNT(*) as count
    FROM users
    WHERE birthdate != '' AND birthdate IS NOT NULL
    GROUP BY age_range
    ORDER BY age_range
  `;
  const addressDistribution = await sql`
    SELECT address, COUNT(*) as count
    FROM users
    WHERE address != '' AND address IS NOT NULL
    GROUP BY address
    ORDER BY count DESC
    LIMIT 10
  `;
  const loggedInViews = await sql`SELECT COUNT(*) as count FROM page_views WHERE user_id IS NOT NULL AND created_at >= ${startDate.toISOString()}`;
  const totalViews = await sql`SELECT COUNT(*) as count FROM page_views WHERE created_at >= ${startDate.toISOString()}`;

  return {
    totalUsers: Number(total[0]?.count || 0),
    recentUsers: Number(recent[0]?.count || 0),
    ageDistribution: ageDistribution as { age_range: string; count: string }[],
    addressDistribution: addressDistribution as { address: string; count: string }[],
    loggedInViewRate: Number(totalViews[0]?.count) > 0
      ? (Number(loggedInViews[0]?.count || 0) / Number(totalViews[0]?.count)) * 100
      : 0,
  };
}
