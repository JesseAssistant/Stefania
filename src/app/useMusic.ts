import { useEffect } from 'react';
import { useApp } from './ctx';
export function useMusic(track: string | null) { const { audio } = useApp(); useEffect(() => { audio.music(track); }, [audio, track]); }
