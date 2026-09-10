-- Require a short course review on final submissions. Legacy answers and drafts remain valid.
create or replace function private.valid_evaluation_answers(p_kind text, p_answers jsonb, p_complete boolean)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare
  v_ratings text[];
  v_texts text[] := array[]::text[];
  v_key text;
  v_value jsonb;
begin
  if p_kind is null or p_kind not in ('self', 'program')
     or p_answers is null or jsonb_typeof(p_answers) <> 'object'
     or octet_length(p_answers::text) > 20000 then return false; end if;
  -- New course feedback is distinct from the legacy learning dimensions.
  if p_kind = 'self' and p_answers ?| array['course_rating', 'course_review'] then
    for v_key, v_value in select key, value from jsonb_each(p_answers) loop
      if v_key = 'course_rating' then
        if jsonb_typeof(v_value) <> 'number' or v_value::text not in ('1', '2', '3', '4', '5') then return false; end if;
      elsif v_key = 'course_review' then
        if jsonb_typeof(v_value) <> 'string' or char_length(p_answers ->> v_key) > 1500 then return false; end if;
      else return false;
      end if;
    end loop;
    if p_complete then
      return p_answers ?& array['course_rating', 'course_review']
        and char_length(regexp_replace(p_answers ->> 'course_review', '(^[[:space:]]+|[[:space:]]+$)', '', 'g')) >= 20;
    end if;
    return true;
  end if;
  if p_kind = 'self' then
    v_ratings := array['comprehension', 'confidence', 'participation', 'communication', 'application'];
    v_texts := array['learning', 'difficulties', 'support', 'next_step'];
  else
    v_ratings := array['organization', 'content', 'mentoring', 'practice', 'infrastructure', 'satisfaction'];
  end if;
  for v_key, v_value in select key, value from jsonb_each(p_answers) loop
    if v_key = any(v_ratings) then
      if v_value <> 'null'::jsonb and (
        jsonb_typeof(v_value) <> 'number' or v_value::text not in ('1', '2', '3', '4', '5')
      ) then return false; end if;
    elsif v_key = any(v_texts) then
      if jsonb_typeof(v_value) <> 'string' or char_length(p_answers ->> v_key) > 1500 then return false; end if;
    else return false;
    end if;
  end loop;
  if p_complete and not (p_answers ?& (v_ratings || v_texts)) then return false; end if;
  return true;
end;
$$;
