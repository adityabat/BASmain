
-- 1. Enable RLS on n8n_chat_histories (n8n uses service_role key which bypasses RLS)
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies for documents (shared knowledge base — read-only for authenticated users)
CREATE POLICY "authenticated_read_documents" ON public.documents
  FOR SELECT TO authenticated USING (true);

-- 3. Add RLS policies for transcripts (user-scoped)
CREATE POLICY "select_own_transcripts" ON public.transcripts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_transcripts" ON public.transcripts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_transcripts" ON public.transcripts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_transcripts" ON public.transcripts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Fix match_documents mutable search_path
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector,
  match_count integer DEFAULT NULL::integer,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(id bigint, content text, metadata jsonb, similarity double precision)
LANGUAGE plpgsql
SET search_path = public
AS $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
