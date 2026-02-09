
-- Create task_comments table for member interactivity on tasks
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.document_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task comments" ON public.task_comments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create task comments" ON public.task_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Add subtasks support
ALTER TABLE public.document_tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.document_tasks(id) ON DELETE CASCADE;
ALTER TABLE public.document_tasks ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0;
