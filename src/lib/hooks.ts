import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Note, Lecture, NoteContent, NoteStyle } from '@/lib/types';

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('load notes', error.message);
    }
    setNotes((data as Note[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createNote = useCallback(async (input: {
    title: string;
    subject?: string;
    tags?: string[];
    content: NoteContent;
    raw_text?: string;
    style?: NoteStyle;
  }): Promise<Note | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('notes')
      .insert({
        title: input.title,
        subject: input.subject ?? 'General',
        tags: input.tags ?? [],
        content: input.content,
        raw_text: input.raw_text ?? null,
        style: input.style ?? 'detailed',
      })
      .select()
      .single();
    if (error) {
      console.warn('create note', error.message);
      return null;
    }
    const note = data as Note;
    setNotes((n) => [note, ...n]);
    return note;
  }, [user]);

  const updateNote = useCallback(async (id: string, patch: Partial<Note>): Promise<boolean> => {
    const { error } = await supabase.from('notes').update(patch).eq('id', id);
    if (error) {
      console.warn('update note', error.message);
      return false;
    }
    setNotes((n) => n.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    return true;
  }, []);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) return false;
    setNotes((n) => n.filter((x) => x.id !== id));
    return true;
  }, []);

  const duplicateNote = useCallback(async (note: Note): Promise<Note | null> => {
    return createNote({
      title: `${note.title} (Copy)`,
      subject: note.subject ?? undefined,
      tags: note.tags,
      content: note.content,
      raw_text: note.raw_text ?? undefined,
      style: note.style,
    });
  }, [createNote]);

  return { notes, loading, load, createNote, updateNote, deleteNote, duplicateNote, setNotes };
}

export function useLectures() {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('lectures')
      .select('*')
      .order('recorded_at', { ascending: false });
    if (error) console.warn('load lectures', error.message);
    setLectures((data as Lecture[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createLecture = useCallback(async (input: {
    file_name?: string;
    subject?: string;
    duration_seconds?: number;
    source_type?: 'recording' | 'upload';
    status?: 'processing' | 'completed' | 'failed';
    transcript?: string;
    note_id?: string;
  }): Promise<Lecture | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('lectures')
      .insert({
        file_name: input.file_name ?? null,
        subject: input.subject ?? null,
        duration_seconds: input.duration_seconds ?? 0,
        source_type: input.source_type ?? 'recording',
        status: input.status ?? 'completed',
        transcript: input.transcript ?? null,
        note_id: input.note_id ?? null,
      })
      .select()
      .single();
    if (error) { console.warn('create lecture', error.message); return null; }
    const lec = data as Lecture;
    setLectures((l) => [lec, ...l]);
    return lec;
  }, [user]);

  const updateLecture = useCallback(async (id: string, patch: Partial<Lecture>): Promise<boolean> => {
    const { error } = await supabase.from('lectures').update(patch).eq('id', id);
    if (error) return false;
    setLectures((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    return true;
  }, []);

  const deleteLecture = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('lectures').delete().eq('id', id);
    if (error) return false;
    setLectures((l) => l.filter((x) => x.id !== id));
    return true;
  }, []);

  return { lectures, loading, load, createLecture, updateLecture, deleteLecture };
}
