const STORY_YEAR = 2026;
const STORY_MONTH_INDEX = 7;
const STORY_DAY = 31;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Shipped Signal helpers pin surfaced/local conversation timestamps to the
 * story calendar date while preserving the source wall-clock time.
 */
export function signalStoryDate(source = new Date()): Date {
  return new Date(
    STORY_YEAR,
    STORY_MONTH_INDEX,
    STORY_DAY,
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds(),
  );
}

export function formatSignalStoryTimestamp(source: Date): string {
  return `${source.getFullYear()}-${pad2(source.getMonth() + 1)}-${pad2(source.getDate())}T${pad2(source.getHours())}:${pad2(source.getMinutes())}:${pad2(source.getSeconds())}`;
}

export function signalStoryTimestamp(source = new Date()): string {
  return formatSignalStoryTimestamp(signalStoryDate(source));
}

export function signalStoryTimestampFromEpoch(milliseconds: number): string {
  return signalStoryTimestamp(new Date(milliseconds));
}
