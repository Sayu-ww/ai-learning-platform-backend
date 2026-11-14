-- Create user_video_progress table
CREATE TABLE IF NOT EXISTS user_video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id VARCHAR(255) NOT NULL,
  playback_time DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration DOUBLE PRECISION,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id, video_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_video_progress_lookup
ON user_video_progress(room_id, user_id, video_id);
