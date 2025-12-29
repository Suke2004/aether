-- Add validation to SECURITY DEFINER functions to ensure data integrity

-- Update update_balance() with validation
CREATE OR REPLACE FUNCTION public.update_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that the user_id exists in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Invalid user_id in transaction: %', NEW.user_id;
  END IF;

  -- Validate amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Transaction amount must be positive: %', NEW.amount;
  END IF;

  -- Validate type is valid
  IF NEW.type NOT IN ('earn', 'spend') THEN
    RAISE EXCEPTION 'Invalid transaction type: %', NEW.type;
  END IF;

  IF NEW.type = 'earn' THEN
    UPDATE public.profiles 
    SET balance = balance + NEW.amount,
        updated_at = now()
    WHERE id = NEW.user_id;
  ELSIF NEW.type = 'spend' THEN
    -- Verify user has sufficient balance before spending
    IF (SELECT balance FROM public.profiles WHERE id = NEW.user_id) < NEW.amount THEN
      RAISE EXCEPTION 'Insufficient balance for user: %', NEW.user_id;
    END IF;
    
    UPDATE public.profiles 
    SET balance = balance - NEW.amount,
        updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_streak() with validation
CREATE OR REPLACE FUNCTION public.update_streak()
RETURNS TRIGGER AS $$
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

  -- Validate that the user_id exists in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Invalid user_id in transaction: %', NEW.user_id;
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;