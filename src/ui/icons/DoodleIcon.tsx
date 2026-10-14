import React from "react";
import { useTheme } from "@/lib/theme";
import { HomeIcon } from "./Home";
import { SunIcon } from "./Sun";
import { BookIcon } from "./Book";
import { ChatIcon } from "./Chat";
import { MessageSquareIcon } from "./MessageSquare";
import { PenIcon } from "./Pen";
import { ChecklistIcon } from "./Checklist";
import { UserIcon } from "./User";
import { SettingsIcon } from "./Settings";
import { PhoneIcon } from "./Phone";
import { ArrowLeftIcon } from "./ArrowLeft";
import { ArrowRightIcon } from "./ArrowRight";
import { ArrowUpIcon } from "./ArrowUp";
import { ChevronRightIcon } from "./ChevronRight";
import { CrossIcon } from "./Cross";
import { TickIcon } from "./Tick";
import { MicIcon } from "./Mic";
import { PlayIcon } from "./Play";
import { PauseIcon } from "./Pause";
import { MusicIcon } from "./Music";
import { MoonIcon } from "./Moon";
import { SearchIcon } from "./Search";
import { TrashIcon } from "./Trash";
import { ShareIcon } from "./Share";
import { LockIcon } from "./Lock";
import { UnlockIcon } from "./Unlock";
import { CompassIcon } from "./Compass";
import { ActivityIcon } from "./Activity";
import { HeartIcon } from "./Heart";
import { PlusIcon } from "./Plus";
import { SparklesIcon } from "./Sparkles";
import { WindIcon } from "./Wind";
import { ShieldIcon } from "./Shield";
import { TvIcon } from "./Tv";
import { UsersIcon } from "./Users";
import { CloudIcon } from "./Cloud";
import { SmartphoneIcon } from "./Smartphone";
import { AlertCircleIcon } from "./AlertCircle";
import { RefreshCwIcon } from "./RefreshCw";
import { DownloadIcon } from "./Download";
import { UploadIcon } from "./Upload";
import { CalendarIcon } from "./Calendar";

export type DoodleIconName =
  | "home"
  | "sun"
  | "calendar"
  | "book"
  | "book-open"
  | "chat"
  | "message-circle"
  | "message-square"
  | "pen"
  | "edit"
  | "edit-3"
  | "checklist"
  | "clipboard"
  | "user"
  | "settings"
  | "phone"
  | "arrow-left"
  | "arrow-right"
  | "chevron-right"
  | "arrow-up"
  | "close"
  | "cross"
  | "x"
  | "check"
  | "tick"
  | "mic"
  | "play"
  | "pause"
  | "music"
  | "moon"
  | "search"
  | "trash"
  | "trash-2"
  | "delete"
  | "share"
  | "share-2"
  | "send"
  | "lock"
  | "unlock"
  | "compass"
  | "activity"
  | "heart"
  | "plus"
  | "sparkles"
  | "wind"
  | "shield"
  | "tv"
  | "users"
  | "cloud"
  | "smartphone"
  | "alert-circle"
  | "refresh-cw"
  | "download"
  | "upload";

export interface DoodleIconProps {
  name: DoodleIconName;
  size?: number;
  color?: string;
  stroke?: string;
  style?: any;
}

export function DoodleIcon({ name, size = 24, color, stroke, style }: DoodleIconProps) {
  const t = useTheme();
  const effectiveColor = stroke || (color && color !== "currentColor" ? color : t.ink);
  switch (name) {
    case "home":
      return <HomeIcon size={size} color={effectiveColor} />;
    case "sun":
      return <SunIcon size={size} color={effectiveColor} />;
    case "book":
    case "book-open":
      return <BookIcon size={size} color={effectiveColor} />;
    case "chat":
    case "message-circle":
      return <ChatIcon size={size} color={effectiveColor} />;
    case "message-square":
      return <MessageSquareIcon size={size} color={effectiveColor} />;
    case "pen":
    case "edit":
    case "edit-3":
      return <PenIcon size={size} color={effectiveColor} />;
    case "checklist":
    case "clipboard":
      return <ChecklistIcon size={size} color={effectiveColor} />;
    case "user":
      return <UserIcon size={size} color={effectiveColor} />;
    case "settings":
      return <SettingsIcon size={size} color={effectiveColor} />;
    case "phone":
      return <PhoneIcon size={size} color={effectiveColor} />;
    case "arrow-left":
      return <ArrowLeftIcon size={size} color={effectiveColor} />;
    case "arrow-right":
      return <ArrowRightIcon size={size} color={effectiveColor} />;
    case "chevron-right":
      return <ChevronRightIcon size={size} color={effectiveColor} />;
    case "arrow-up":
      return <ArrowUpIcon size={size} color={effectiveColor} />;
    case "close":
    case "cross":
    case "x":
      return <CrossIcon size={size} color={effectiveColor} />;
    case "check":
    case "tick":
      return <TickIcon size={size} color={effectiveColor} />;
    case "mic":
      return <MicIcon size={size} color={effectiveColor} />;
    case "play":
      return <PlayIcon size={size} color={effectiveColor} />;
    case "pause":
      return <PauseIcon size={size} color={effectiveColor} />;
    case "music":
      return <MusicIcon size={size} color={effectiveColor} />;
    case "moon":
      return <MoonIcon size={size} color={effectiveColor} />;
    case "search":
      return <SearchIcon size={size} color={effectiveColor} />;
    case "trash":
    case "trash-2":
    case "delete":
      return <TrashIcon size={size} color={effectiveColor} />;
    case "share":
    case "share-2":
    case "send":
      return <ShareIcon size={size} color={effectiveColor} />;
    case "lock":
      return <LockIcon size={size} color={effectiveColor} />;
    case "unlock":
      return <UnlockIcon size={size} color={effectiveColor} />;
    case "compass":
      return <CompassIcon size={size} color={effectiveColor} />;
    case "activity":
      return <ActivityIcon size={size} color={effectiveColor} />;
    case "heart":
      return <HeartIcon size={size} color={effectiveColor} />;
    case "plus":
      return <PlusIcon size={size} color={effectiveColor} />;
    case "sparkles":
      return <SparklesIcon size={size} color={effectiveColor} />;
    case "wind":
      return <WindIcon size={size} color={effectiveColor} />;
    case "shield":
      return <ShieldIcon size={size} color={effectiveColor} />;
    case "tv":
      return <TvIcon size={size} color={effectiveColor} />;
    case "users":
      return <UsersIcon size={size} color={effectiveColor} />;
    case "cloud":
      return <CloudIcon size={size} color={effectiveColor} />;
    case "smartphone":
      return <SmartphoneIcon size={size} color={effectiveColor} />;
    case "alert-circle":
      return <AlertCircleIcon size={size} color={effectiveColor} />;
    case "refresh-cw":
      return <RefreshCwIcon size={size} color={effectiveColor} />;
    case "download":
      return <DownloadIcon size={size} color={effectiveColor} />;
    case "upload":
      return <UploadIcon size={size} color={effectiveColor} />;
    case "calendar":
      return <CalendarIcon size={size} color={effectiveColor} />;
    default:
      return <CompassIcon size={size} color={effectiveColor} />;
  }
}
