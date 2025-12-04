// Non-reactive player ID storage to prevent green ring bleed-through
export const myPlayerIdRef = { current: undefined as string | undefined };