CREATE TABLE public.consultation_slots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), teacher_id uuid NOT NULL REFERENCES public.profiles(id), subject_id uuid NOT NULL REFERENCES public.subjects(id), teacher_name text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, location text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), CHECK(ends_at > starts_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_slots TO authenticated;
GRANT ALL ON public.consultation_slots TO service_role;
ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY slots_read ON public.consultation_slots FOR SELECT TO authenticated USING(true);
CREATE POLICY slots_create ON public.consultation_slots FOR INSERT TO authenticated WITH CHECK(teacher_id = auth.uid() AND public.is_staff(auth.uid()) AND public.can_manage_subject(auth.uid(),subject_id));
CREATE TABLE public.consultation_bookings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slot_id uuid NOT NULL UNIQUE REFERENCES public.consultation_slots(id), student_id uuid NOT NULL REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.consultation_bookings TO authenticated;
GRANT ALL ON public.consultation_bookings TO service_role;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_read ON public.consultation_bookings FOR SELECT TO authenticated USING(student_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.consultation_slots s WHERE s.id=slot_id AND s.teacher_id=auth.uid()));
CREATE FUNCTION public.validate_consultation_slot() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext(NEW.teacher_id::text));
 IF NEW.starts_at <= now() THEN RAISE EXCEPTION 'Office hours must start in the future'; END IF;
 IF EXISTS(SELECT 1 FROM public.consultation_slots s WHERE s.teacher_id=NEW.teacher_id AND s.starts_at<NEW.ends_at AND s.ends_at>NEW.starts_at) THEN RAISE EXCEPTION 'Office hours overlap an existing slot'; END IF;
 SELECT full_name INTO NEW.teacher_name FROM public.profiles WHERE id=NEW.teacher_id;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_consultation_slot BEFORE INSERT ON public.consultation_slots FOR EACH ROW EXECUTE FUNCTION public.validate_consultation_slot();
CREATE FUNCTION public.reserve_consultation(p_slot uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.consultation_slots; booking uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'student') THEN RAISE EXCEPTION 'Only students can reserve consultations'; END IF;
 SELECT * INTO s FROM public.consultation_slots WHERE id=p_slot FOR UPDATE;
 IF NOT FOUND OR s.starts_at<=now() THEN RAISE EXCEPTION 'This slot is no longer available'; END IF;
 IF EXISTS(SELECT 1 FROM public.consultation_bookings b JOIN public.consultation_slots x ON x.id=b.slot_id WHERE b.student_id=auth.uid() AND x.starts_at<s.ends_at AND x.ends_at>s.starts_at) THEN RAISE EXCEPTION 'You already have a consultation at this time'; END IF;
 INSERT INTO public.consultation_bookings(slot_id,student_id) VALUES(p_slot,auth.uid()) RETURNING id INTO booking;
 RETURN booking;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'This slot has already been reserved';
END $$;
REVOKE ALL ON FUNCTION public.reserve_consultation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_consultation(uuid) TO authenticated;
CREATE FUNCTION public.cancel_consultation(p_booking uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 DELETE FROM public.consultation_bookings b USING public.consultation_slots s WHERE b.id=p_booking AND s.id=b.slot_id AND b.student_id=auth.uid() AND s.starts_at>now();
 IF NOT FOUND THEN RAISE EXCEPTION 'This reservation cannot be cancelled'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.cancel_consultation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_consultation(uuid) TO authenticated;
CREATE FUNCTION public.consultation_availability() RETURNS TABLE(slot_id uuid,reserved boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT s.id, EXISTS(SELECT 1 FROM public.consultation_bookings b WHERE b.slot_id=s.id) FROM public.consultation_slots s WHERE auth.uid() IS NOT NULL $$;
REVOKE ALL ON FUNCTION public.consultation_availability() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consultation_availability() TO authenticated;