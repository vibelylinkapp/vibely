-- 0049: tighten the server-side age guard.
-- 0001 already blocks under-18s. This also rejects implausible dates (more
-- than 100 years ago), usually typos such as 0199 for 1999. It only checks
-- when birthdate is being set or changed, so existing rows never block other
-- profile updates.
create or replace function public.enforce_adult() returns trigger as $$
begin
  if new.birthdate is not null
     and (tg_op = 'INSERT' or new.birthdate is distinct from old.birthdate) then
    if new.birthdate > (current_date - interval '18 years') then
      raise exception 'User must be at least 18 years old';
    end if;
    if new.birthdate < (current_date - interval '100 years') then
      raise exception 'Please check the date of birth';
    end if;
  end if;
  return new;
end $$ language plpgsql set search_path = public;
