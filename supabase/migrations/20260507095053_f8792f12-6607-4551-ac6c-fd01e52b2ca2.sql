
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.account_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.stage_key AS ENUM (
  'account_approval',
  'training_videos',
  'audio_lessons',
  'knowledge_test',
  'voice_answers',
  'overts',
  'goals',
  'gratitude',
  'completed'
);

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  account_status public.account_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================
-- USER ROLES
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================
-- USER PROGRESS
-- =========================
CREATE TABLE public.user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage public.stage_key NOT NULL DEFAULT 'account_approval',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- =========================
-- STAGE SUBMISSIONS (videos watched, test answers, voice answers)
-- =========================
CREATE TABLE public.stage_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage public.stage_key NOT NULL,
  question_index INT NOT NULL DEFAULT 0,
  question_text TEXT,
  text_answer TEXT,
  audio_path TEXT,
  status public.submission_status NOT NULL DEFAULT 'pending',
  admin_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stage_submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.stage_submissions (user_id, stage);

-- =========================
-- OVERTS
-- =========================
CREATE TABLE public.overts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  what_happened TEXT,
  who_involved TEXT,
  emotions TEXT,
  notes TEXT,
  status public.submission_status NOT NULL DEFAULT 'pending',
  admin_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.overts ENABLE ROW LEVEL SECURITY;

-- =========================
-- GOALS
-- =========================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  why_text TEXT,
  how_text TEXT,
  by_when DATE,
  status public.submission_status NOT NULL DEFAULT 'pending',
  admin_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- =========================
-- GRATITUDE ENTRIES
-- =========================
CREATE TABLE public.gratitude_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS POLICIES
-- =========================

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_progress
CREATE POLICY "Users view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all progress" ON public.user_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update progress" ON public.user_progress FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- stage_submissions
CREATE POLICY "Users manage own submissions select" ON public.stage_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all submissions" ON public.stage_submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own submissions" ON public.stage_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own submissions" ON public.stage_submissions FOR UPDATE USING (auth.uid() = user_id AND status = 'rejected');
CREATE POLICY "Admins update submissions" ON public.stage_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own pending" ON public.stage_submissions FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- overts
CREATE POLICY "Users view own overts" ON public.overts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all overts" ON public.overts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own overts" ON public.overts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own overts" ON public.overts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins update overts" ON public.overts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own overts" ON public.overts FOR DELETE USING (auth.uid() = user_id AND status != 'approved');

-- goals
CREATE POLICY "Users view own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all goals" ON public.goals FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins update goals" ON public.goals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- gratitude
CREATE POLICY "Users view own gratitude" ON public.gratitude_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all gratitude" ON public.gratitude_entries FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own gratitude" ON public.gratitude_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own gratitude" ON public.gratitude_entries FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- TRIGGERS
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER progress_updated BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subs_updated BEFORE UPDATE ON public.stage_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER overts_updated BEFORE UPDATE ON public.overts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- New user signup trigger: create profile, role, and progress row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  INSERT INTO public.user_progress (user_id) VALUES (NEW.id);

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- STORAGE BUCKET (private)
-- =========================
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);

CREATE POLICY "Users upload own recordings" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own recordings" ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users delete own recordings" ON storage.objects FOR DELETE
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
