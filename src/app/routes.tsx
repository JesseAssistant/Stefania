import type { ComponentType } from 'react';
import { Welcome } from '../screens/Welcome';
import { Tabs } from '../screens/Tabs';
import { CharacterScreen } from '../screens/Collection';
import { RoomScreen } from '../screens/Room';
import { MapScreen } from '../screens/Map';
import { LevelScreen, ArcadeScreen, CookScreen } from '../screens/Play';
import { QuestsScreen } from '../screens/Quests';
import { AlbumScreen } from '../screens/Album';
import { PhotosScreen } from '../screens/Photos';
import { ChestScreen } from '../screens/Chests';
import { PersonalScreen } from '../screens/Personal';
import { SandboxScreen } from '../screens/Sandbox';
import { SettingsScreen } from '../screens/Settings';
import { InstallScreen } from '../screens/Install';
import { SaveCenter } from '../screens/SaveCenter';

export type ScreenProps = { params: Record<string, unknown> };
export const ROUTES: Record<string, ComponentType<ScreenProps>> = {
  welcome: Welcome,
  tabs: Tabs,
  character: CharacterScreen,
  room: RoomScreen,
  map: MapScreen,
  level: LevelScreen,
  arcade: ArcadeScreen,
  cook: CookScreen,
  quests: QuestsScreen,
  album: AlbumScreen,
  photos: PhotosScreen,
  chests: ChestScreen,
  personal: PersonalScreen,
  sandbox: SandboxScreen,
  settings: SettingsScreen,
  install: InstallScreen,
  save: SaveCenter,
};
export function Missing({ name }: { name: string }) { return <div style={{ padding: 40 }}>Экран «{name}» ещё не готов</div>; }
