// #xar:controller-launch-proof/pass-b
// #xio:emulator/controller/arcade-navigation

/** Standard W3C gamepad button indices used for Arcade Home navigation. */
const BTN = {
  A: 0,
  X: 2,
  Y: 3,
  START: 9,
  SELECT: 8,
  D_UP: 12,
  D_DOWN: 13,
  D_LEFT: 14,
  D_RIGHT: 15,
} as const;

const STICK_DEADZONE = 0.45;

export interface ArcadeGamepadEdges {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  confirm: boolean;
  favorite: boolean;
  search: boolean;
  menu: boolean;
}

export interface ArcadeGamepadPollState {
  connected: boolean;
  label: string;
  pressed: boolean[];
  axes: number[];
}

const emptyPollState = (): ArcadeGamepadPollState => ({
  connected: false,
  label: '',
  pressed: [],
  axes: [],
});

export const getPrimaryGamepad = (): Gamepad | null => {
  const pads = navigator.getGamepads?.() ?? [];
  return Array.from(pads).find((p) => p != null) ?? null;
};

const axisDirection = (value: number): -1 | 0 | 1 => {
  if (value < -STICK_DEADZONE) return -1;
  if (value > STICK_DEADZONE) return 1;
  return 0;
};

const readDirection = (pad: Gamepad): { up: boolean; down: boolean; left: boolean; right: boolean } => {
  const b = pad.buttons;
  const up = b[BTN.D_UP]?.pressed || axisDirection(pad.axes[1] ?? 0) < 0;
  const down = b[BTN.D_DOWN]?.pressed || axisDirection(pad.axes[1] ?? 0) > 0;
  const left = b[BTN.D_LEFT]?.pressed || axisDirection(pad.axes[0] ?? 0) < 0;
  const right = b[BTN.D_RIGHT]?.pressed || axisDirection(pad.axes[0] ?? 0) > 0;
  return { up, down, left, right };
};

const edge = (now: boolean, prev: boolean): boolean => now && !prev;

/** Returns one-shot button edges for the primary connected gamepad. */
export const pollArcadeGamepadEdges = (
  previous: ArcadeGamepadPollState
): { edges: ArcadeGamepadEdges; state: ArcadeGamepadPollState } => {
  const pad = getPrimaryGamepad();
  if (!pad) {
    return {
      edges: {
        up: false,
        down: false,
        left: false,
        right: false,
        confirm: false,
        favorite: false,
        search: false,
        menu: false,
      },
      state: emptyPollState(),
    };
  }

  const pressed = pad.buttons.map((btn) => btn.pressed);
  const axes = [...pad.axes];
  const prevPressed = previous.pressed;
  const prevDir = previous.connected ? readDirectionFromSnapshot(previous) : { up: false, down: false, left: false, right: false };
  const dir = readDirection(pad);

  const edges: ArcadeGamepadEdges = {
    up: edge(dir.up, prevDir.up),
    down: edge(dir.down, prevDir.down),
    left: edge(dir.left, prevDir.left),
    right: edge(dir.right, prevDir.right),
    confirm: edge(pressed[BTN.A] ?? false, prevPressed[BTN.A] ?? false),
    favorite: edge(pressed[BTN.X] ?? false, prevPressed[BTN.X] ?? false),
    search: edge(pressed[BTN.Y] ?? false, prevPressed[BTN.Y] ?? false),
    menu:
      edge(pressed[BTN.START] ?? false, prevPressed[BTN.START] ?? false) ||
      edge(pressed[BTN.SELECT] ?? false, prevPressed[BTN.SELECT] ?? false),
  };

  return {
    edges,
    state: {
      connected: true,
      label: pad.id,
      pressed,
      axes,
    },
  };
};

const readDirectionFromSnapshot = (snap: ArcadeGamepadPollState): {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
} => ({
  up: snap.pressed[BTN.D_UP] || axisDirection(snap.axes[1] ?? 0) < 0,
  down: snap.pressed[BTN.D_DOWN] || axisDirection(snap.axes[1] ?? 0) > 0,
  left: snap.pressed[BTN.D_LEFT] || axisDirection(snap.axes[0] ?? 0) < 0,
  right: snap.pressed[BTN.D_RIGHT] || axisDirection(snap.axes[0] ?? 0) > 0,
});
