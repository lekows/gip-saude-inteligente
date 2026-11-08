export type AvailableMap = { health_unit_id: string; version: number };
export function latestUnitMaps<T extends AvailableMap>(maps: T[]): T[] {
  const latest = new Map<string,T>();
  for (const map of maps) {
    const previous = latest.get(map.health_unit_id);
    if (!previous || previous.version < map.version) latest.set(map.health_unit_id, map);
  }
  return [...latest.values()];
}

