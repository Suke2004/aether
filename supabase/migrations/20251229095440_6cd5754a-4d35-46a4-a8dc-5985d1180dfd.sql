-- Add streak tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_quest_date DATE;

-- Create function to update streak when a quest is completed (earn transaction)
CREATE OR REPLACE FUNCTION public.update_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date DATE;
  current_s INTEGER;
  longest_s INTEGER;
  today DATE := CURRENT_DATE;
  streak_bonus INTEGER := 0;
BEGIN
  -- Only process earn transactions (quests)
  IF NEW.type != 'earn' THEN
    RETURN NEW;
  END IF;

  -- Get current streak info
  SELECT last_quest_date, current_streak, longest_streak 
  INTO last_date, current_s, longest_s
  FROM public.profiles 
  WHERE id = NEW.user_id;

  -- Calculate new streak
  IF last_date IS NULL OR last_date < today - INTERVAL '1 day' THEN
    -- Streak broken or first quest, start at 1
    current_s := 1;
  ELSIF last_date = today - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    current_s := current_s + 1;
  ELSIF last_date = today THEN
    -- Already completed a quest today, keep streak same
    -- Do nothing to streak
    RETURN NEW;
  END IF;

  -- Update longest streak if needed
  IF current_s > longest_s THEN
    longest_s := current_s;
  END IF;

  -- Calculate streak bonus (5 coins per day of streak, max 50)
  streak_bonus := LEAST(current_s * 5, 50);

  -- Update profile with new streak data
  UPDATE public.profiles 
  SET 
    current_streak = current_s,
    longest_streak = longest_s,
    last_quest_date = today,
    balance = balance + streak_bonus,
    updated_at = now()
  WHERE id = NEW.user_id;

  -- If there's a streak bonus, log it as a separate transaction
  IF streak_bonus > 0 AND (last_date IS NULL OR last_date != today) THEN
    INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (NEW.user_id, streak_bonus, 'earn', 'Streak Bonus! 🔥 Day ' || current_s);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for streak updates (runs AFTER the balance update trigger)
DROP TRIGGER IF EXISTS update_streak_on_earn ON public.transactions;
CREATE TRIGGER update_streak_on_earn
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_streak();