-- Create notifications table for order status updates and system alerts
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  member_id VARCHAR(255) REFERENCES members(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('order', 'earning', 'promo', 'system')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid()::text)
  );

-- Policy: Service role can insert notifications
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()::text
    OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid()::text)
  );

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE
  USING (
    user_id = auth.uid()::text
    OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid()::text)
  );
