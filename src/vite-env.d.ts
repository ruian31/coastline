/// <reference types="vite/client" />

interface ThreeGameDiagnostics {
  frame: number;
  elapsed: number;
  score: number;
  targetScore: number;
  complete: boolean;
  player: {
    position: { x: number; y: number; z: number };
    speed: number;
  };
  vehicle?: {wetness?:number;engine:string;mass:number;steps:number;colliders:number;fixedTriangles:number;velocity:number[];lateralSpeed:number;steeringAngle:number;wheels:{length:number;force:number;contact:boolean;y:number}[]};
  vehicleLights?: {headlights:boolean;braking:boolean;reversing:boolean};
  season?: {target:string;transitioning:boolean;seconds:number;amount:number;ground:number[];grass:number[]};
  weather?: {target:string;natural:boolean;transitioning:boolean;seconds:number;cloud:number;mist:number;rain:number;wind:number;wetness:number;drizzle?:{ready:boolean;active:boolean;scheduledDraws:number;capacity:number;seconds:number;heightUploads:number};audio?:{ready:boolean;gain:number;windGain:number};sky:{updates:number;draws:number;triangles:number;active:boolean}};
  daylight?: {id:string;loading:boolean;direction:number[];skyIntensity:number;environmentIntensity:number;cycle?:{hour:number;flow:boolean;loading:boolean;cache:{sourceLoads:number;sourceBakes:number;updates:number;resident:string[];peakResident:number}}};
  vehicleMirrors?: {active:boolean;passes:number;draws:number;triangles:number;views:{name:string;updates:number;width:number;height:number}[]};
  cameraRig?: {cockpitEyeError:number|null;orbitYaw:number;orbitPitch:number;boomDistance:number|null;availableDistance:number|null};
  lighting?: {ready:boolean;mode:string;bakes:number;bakeDraws:number;localPasses:number;localDraws:number;localTriangles:number;mapSize:number;projectedWidth:number;projectedHeight:number;casters:number};
  renderer: {
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
    mainCalls?:number;
    mainTriangles?:number;
  };
  state?: {running:boolean;paused:boolean;automatic:boolean;camera:number;car:number;road:string;progress:number;steer:number;offroad:boolean;roadDistance:number;groundPitch:number;groundRoll:number;hit:boolean;distance:number;preferHill:boolean;music:boolean;muted:boolean;audioState:string;fps:number;quality:string;renderTier:string};
  canvas: {
    clientWidth: number;
    clientHeight: number;
    width: number;
    height: number;
    dpr: number;
  };
}

interface ThreeGameTestHooks {
  /** Re-seed the game RNG; all gameplay randomness must flow through it. */
  seed?(value: number): void | Promise<void>;
  /** Acknowledge after setup/assets are ready; throw for unknown states. */
  setState(name: string): { state: string } | Promise<{ state: string }>;
  /** Stop simulation/state transitions immediately; keep rendering. Await optional synchronization. */
  setPausedForScreenshot(paused: boolean): void | Promise<void>;
  /** Stabilize ambient/idle visuals without requiring an unpaused simulation tick. */
  setReducedMotion(enabled: boolean): void | Promise<void>;
  /** Freeze simulation at an explicit ambient time for animated-surface verification. */
  stepDriving?(seconds:number,intent?:{throttle:number;brake:number;steer:number;handbrake:boolean}):void;
  setSceneTime?(seconds: number): void | Promise<void>;
  setSeason?(id:string,seconds?:number):void;
  setWeather?(id:string,seconds?:number):void;
  setDaylight?(id:string):Promise<boolean>;
  setDaylightCycle?(hour:number,flow?:boolean):Promise<boolean>;
  /** Hide debug UI (lil-gui) before capturing. */
  hideDebugUi?(hidden: boolean): void | Promise<void>;
}

interface Window {
  __THREE_GAME_DIAGNOSTICS__?: ThreeGameDiagnostics;
  __THREE_GAME_TEST_HOOKS__?: ThreeGameTestHooks;
}
