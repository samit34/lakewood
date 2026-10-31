import {
  BookOpen, Briefcase, Building2, CalendarCheck, GraduationCap, MessagesSquare, Mic, Puzzle, SearchCheck, Sprout,
  type LucideIcon,
} from 'lucide-react';
import type { IconName } from '@/config/site';

const icons: Record<IconName, LucideIcon> = {
  chat: MessagesSquare,
  puzzle: Puzzle,
  mic: Mic,
  book: BookOpen,
  search: SearchCheck,
  calendar: CalendarCheck,
  student: GraduationCap,
  briefcase: Briefcase,
  building: Building2,
  sprout: Sprout,
};

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  const C = icons[name];
  return <C aria-hidden="true" className={className} strokeWidth={2} />;
}
