-- Migration: RLS Security Fixes
-- Fixes identified in security audit

-- ============================================================
-- 1. FIX: triage_messages SELECT policy
--    Problem: Admin could read messages from ANY clinic
--    Fix: Add clinic scoping via session relationship
-- ============================================================

DROP POLICY IF EXISTS "triage_messages: clinic admin reads" ON triage_messages;

CREATE POLICY "triage_messages: clinic admin reads"
  ON triage_messages
  FOR SELECT
  TO public
  USING (
    -- Clinic admin: session belongs to a clinic they own
    EXISTS (
      SELECT 1
      FROM triage_sessions ts
      WHERE ts.id = triage_messages.session_id
        AND EXISTS (
          SELECT 1 FROM clinics c
          WHERE c.owner_id = get_my_user_id()
        )
    )
    -- Patient: session matches their email
    OR EXISTS (
      SELECT 1
      FROM triage_sessions ts
      WHERE ts.id = triage_messages.session_id
        AND ts.patient_email = (
          SELECT email FROM users WHERE supabase_id = auth.uid()::text LIMIT 1
        )
    )
  );

-- ============================================================
-- 2. FIX: triage_sessions SELECT policy
--    Problem: No clinic scoping
-- ============================================================

DROP POLICY IF EXISTS "triage_sessions: clinic admin reads" ON triage_sessions;

CREATE POLICY "triage_sessions: clinic admin reads"
  ON triage_sessions
  FOR SELECT
  TO public
  USING (
    -- Admin: owns at least one clinic
    EXISTS (
      SELECT 1 FROM clinics c
      WHERE c.owner_id = get_my_user_id()
    )
    -- Patient: session email matches their account
    OR patient_email = (
      SELECT email FROM users WHERE supabase_id = auth.uid()::text LIMIT 1
    )
  );

-- ============================================================
-- 3. FIX: triage_sessions UPDATE policy
--    Problem: No clinic scoping for updates
-- ============================================================

DROP POLICY IF EXISTS "triage_sessions: clinic admin updates" ON triage_sessions;

CREATE POLICY "triage_sessions: clinic admin updates"
  ON triage_sessions
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM clinics c
      WHERE c.owner_id = get_my_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinics c
      WHERE c.owner_id = get_my_user_id()
    )
  );

-- ============================================================
-- 4. FIX: Add DELETE policies for triage data (admin only)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'triage_sessions' AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "triage_sessions: admin delete"
      ON triage_sessions
      FOR DELETE
      TO public
      USING (
        EXISTS (
          SELECT 1 FROM clinics c
          WHERE c.owner_id = get_my_user_id()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'triage_messages' AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "triage_messages: admin delete"
      ON triage_messages
      FOR DELETE
      TO public
      USING (
        EXISTS (
          SELECT 1 FROM triage_sessions ts
          WHERE ts.id = triage_messages.session_id
            AND EXISTS (
              SELECT 1 FROM clinics c
              WHERE c.owner_id = get_my_user_id()
            )
        )
      );
  END IF;
END $$;

-- ============================================================
-- 5. FIX: appointments DELETE policy
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'appointments' AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "appointments: owner delete"
      ON appointments
      FOR DELETE
      TO public
      USING (
        clinic_id IN (
          SELECT id FROM clinics WHERE owner_id = get_my_user_id()
        )
        OR patient_id = (
          SELECT id FROM users WHERE supabase_id = auth.uid()::text LIMIT 1
        )
      );
  END IF;
END $$;
