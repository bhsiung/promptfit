/**
 * Workout Renderer — Image Asset Mapping (v3)
 * Maps exercise_id to CDN URLs for 4 responsive sizes:
 *   mobile_2x  → 800px wide WebP (Retina mobile)
 *   mobile_1x  → 400px wide WebP (standard mobile)
 *   thumb_2x   → 200px wide WebP (Retina thumbnail)
 *   thumb_1x   → 100px wide WebP (standard thumbnail)
 *
 * Unilateral exercises (18 total) have separate left/right frame variants.
 * Non-unilateral exercises have a single neutral frame set.
 *
 * Placeholder convention:
 *   - PLACEHOLDER_URL: used for exercises without real images yet
 *   All placeholder entries are marked with a // TODO: comment for easy grep
 *
 * Kettlebell exercises (5) added 2026-03-08 from pipeline Run #022/#023 (E2 flat vector style).
 * CDN2 = pipeline-test-viewer bucket (same CloudFront distribution, different path prefix).
 */

const CDN = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/XyFvSN3VK3nvaXR5w2ESua';
const CDN2 = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/6UENsf7ApyY3mr8A4k64sG';

// TODO: replace with real CDN URLs when unilateral animations are generated
const PLACEHOLDER_URL = `${CDN}/push_up_frame1_mobile_2x_16e13720.webp`;

export interface ExerciseFrameSet {
  mobile_2x: string;
  mobile_1x: string;
  thumb_2x: string;
  thumb_1x: string;
}

export interface ExerciseFramePair {
  frame1: ExerciseFrameSet;
  frame2: ExerciseFrameSet;
}

/** Bilateral exercise: one neutral frame pair */
export interface BilateralFrames {
  kind: 'bilateral';
  neutral: ExerciseFramePair;
  isPlaceholder: boolean;
}

/** Unilateral exercise: separate left and right frame pairs */
export interface UnilateralFrames {
  kind: 'unilateral';
  left: ExerciseFramePair;
  right: ExerciseFramePair;
  isPlaceholder: boolean; // true if either side is a placeholder
}

export type ExerciseFrames = BilateralFrames | UnilateralFrames;

// ─── Helper to build a placeholder FrameSet ─────────────────────────────────
function placeholderSet(url: string): ExerciseFrameSet {
  return { mobile_2x: url, mobile_1x: url, thumb_2x: url, thumb_1x: url };
}

function placeholderPair(frame1Url: string, frame2Url: string): ExerciseFramePair {
  return { frame1: placeholderSet(frame1Url), frame2: placeholderSet(frame2Url) };
}

// ─── Bilateral exercises with real images ───────────────────────────────────
// (23 exercises, 92 WebP files — includes 5 kettlebell exercises from Run #022/#023)
const BILATERAL_REAL: Record<string, ExerciseFramePair> = {
  // ─── Kettlebell exercises — E2 flat vector style (Run #022/#023) ───────────
  goblet_squat: {
    frame1: {
      mobile_2x: `${CDN2}/goblet_squat_frame1_mobile_2x_559eaf39.webp`,
      mobile_1x: `${CDN2}/goblet_squat_frame1_mobile_1x_ad9f0aac.webp`,
      thumb_2x:  `${CDN2}/goblet_squat_frame1_thumb_2x_44ae2a39.webp`,
      thumb_1x:  `${CDN2}/goblet_squat_frame1_thumb_1x_da9aff52.webp`,
    },
    frame2: {
      mobile_2x: `${CDN2}/goblet_squat_frame2_mobile_2x_1fb1e29f.webp`,
      mobile_1x: `${CDN2}/goblet_squat_frame2_mobile_1x_ecc4f3ce.webp`,
      thumb_2x:  `${CDN2}/goblet_squat_frame2_thumb_2x_78b09bca.webp`,
      thumb_1x:  `${CDN2}/goblet_squat_frame2_thumb_1x_3a9a9a97.webp`,
    },
  },
  kb_swing: {
    frame1: {
      mobile_2x: `${CDN2}/kb_swing_frame1_mobile_2x_ded60e4a.webp`,
      mobile_1x: `${CDN2}/kb_swing_frame1_mobile_1x_4119b817.webp`,
      thumb_2x:  `${CDN2}/kb_swing_frame1_thumb_2x_02518b4e.webp`,
      thumb_1x:  `${CDN2}/kb_swing_frame1_thumb_1x_70dc4535.webp`,
    },
    frame2: {
      mobile_2x: `${CDN2}/kb_swing_frame2_mobile_2x_a6169e50.webp`,
      mobile_1x: `${CDN2}/kb_swing_frame2_mobile_1x_25114e85.webp`,
      thumb_2x:  `${CDN2}/kb_swing_frame2_thumb_2x_92634866.webp`,
      thumb_1x:  `${CDN2}/kb_swing_frame2_thumb_1x_83c0eb9d.webp`,
    },
  },
  arnold_press: {
    frame1: {
      mobile_2x: `${CDN2}/arnold_press_frame1_mobile_2x_bd63c7f5.webp`,
      mobile_1x: `${CDN2}/arnold_press_frame1_mobile_1x_7b72621b.webp`,
      thumb_2x:  `${CDN2}/arnold_press_frame1_thumb_2x_a5a84956.webp`,
      thumb_1x:  `${CDN2}/arnold_press_frame1_thumb_1x_7f5a8bb6.webp`,
    },
    frame2: {
      mobile_2x: `${CDN2}/arnold_press_frame2_mobile_2x_224db033.webp`,
      mobile_1x: `${CDN2}/arnold_press_frame2_mobile_1x_ad2c424f.webp`,
      thumb_2x:  `${CDN2}/arnold_press_frame2_thumb_2x_2ff3032f.webp`,
      thumb_1x:  `${CDN2}/arnold_press_frame2_thumb_1x_289ba997.webp`,
    },
  },
  kb_deadlift: {
    frame1: {
      mobile_2x: `${CDN2}/kb_deadlift_frame1_mobile_2x_3aefd20c.webp`,
      mobile_1x: `${CDN2}/kb_deadlift_frame1_mobile_1x_feaadee5.webp`,
      thumb_2x:  `${CDN2}/kb_deadlift_frame1_thumb_2x_4f2789f7.webp`,
      thumb_1x:  `${CDN2}/kb_deadlift_frame1_thumb_1x_afdc9868.webp`,
    },
    frame2: {
      mobile_2x: `${CDN2}/kb_deadlift_frame2_mobile_2x_bdbd8ed7.webp`,
      mobile_1x: `${CDN2}/kb_deadlift_frame2_mobile_1x_7bc455f9.webp`,
      thumb_2x:  `${CDN2}/kb_deadlift_frame2_thumb_2x_114946db.webp`,
      thumb_1x:  `${CDN2}/kb_deadlift_frame2_thumb_1x_7bc67cea.webp`,
    },
  },
  clean_and_press: {
    frame1: {
      mobile_2x: `${CDN2}/clean_and_press_frame1_mobile_2x_5b32acb4.webp`,
      mobile_1x: `${CDN2}/clean_and_press_frame1_mobile_1x_bb7f6552.webp`,
      thumb_2x:  `${CDN2}/clean_and_press_frame1_thumb_2x_cf640c74.webp`,
      thumb_1x:  `${CDN2}/clean_and_press_frame1_thumb_1x_ed2c8272.webp`,
    },
    frame2: {
      mobile_2x: `${CDN2}/clean_and_press_frame2_mobile_2x_c974a727.webp`,
      mobile_1x: `${CDN2}/clean_and_press_frame2_mobile_1x_77d97367.webp`,
      thumb_2x:  `${CDN2}/clean_and_press_frame2_thumb_2x_08b5ce8f.webp`,
      thumb_1x:  `${CDN2}/clean_and_press_frame2_thumb_1x_ac7f013c.webp`,
    },
  },
  // ─── End kettlebell exercises ──────────────────────────────────────────────
  preacher_curl: {
    frame1: {
      mobile_2x: `${CDN}/preacher_curl_frame1_mobile_2x_3be47a68.webp`,
      mobile_1x: `${CDN}/preacher_curl_frame1_mobile_1x_64a3ca1f.webp`,
      thumb_2x:  `${CDN}/preacher_curl_frame1_thumb_2x_0e9d2fab.webp`,
      thumb_1x:  `${CDN}/preacher_curl_frame1_thumb_1x_8c224b07.webp`,
    },
    frame2: {
      mobile_2x: `${CDN}/preacher_curl_frame2_mobile_2x_0acfb223.webp`,
      mobile_1x: `${CDN}/preacher_curl_frame2_mobile_1x_d65c4bc5.webp`,
      thumb_2x:  `${CDN}/preacher_curl_frame2_thumb_2x_00029308.webp`,
      thumb_1x:  `${CDN}/preacher_curl_frame2_thumb_1x_a4f6ce2b.webp`,
    },
  },
  pull_up: {
    frame1: {
      mobile_2x: `${CDN}/pull_up_frame1_mobile_2x_b862e16c.webp`,
      mobile_1x: `${CDN}/pull_up_frame1_mobile_1x_342892d6.webp`,
      thumb_2x:  `${CDN}/pull_up_frame1_thumb_2x_af8e767d.webp`,
      thumb_1x:  `${CDN}/pull_up_frame1_thumb_1x_3d4f4f1c.webp`,
    },
    frame2: {
      mobile_2x: `${CDN}/pull_up_frame2_mobile_2x_4f257e54.webp`,
      mobile_1x: `${CDN}/pull_up_frame2_mobile_1x_b0fcc0b5.webp`,
      thumb_2x:  `${CDN}/pull_up_frame2_thumb_2x_298870ac.webp`,
      thumb_1x:  `${CDN}/pull_up_frame2_thumb_1x_288daba6.webp`,
    },
  },
  push_up: {
    frame1: {
      mobile_2x: `${CDN}/push_up_frame1_mobile_2x_16e13720.webp`,
      mobile_1x: `${CDN}/push_up_frame1_mobile_1x_95235f5b.webp`,
      thumb_2x:  `${CDN}/push_up_frame1_thumb_2x_1ba804a2.webp`,
      thumb_1x:  `${CDN}/push_up_frame1_thumb_1x_189555f5.webp`,
    },
    frame2: {
      mobile_2x: `${CDN}/push_up_frame2_mobile_2x_69750bd5.webp`,
      mobile_1x: `${CDN}/push_up_frame2_mobile_1x_2f4513d7.webp`,
      thumb_2x:  `${CDN}/push_up_frame2_thumb_2x_a1bd4b5b.webp`,
      thumb_1x:  `${CDN}/push_up_frame2_thumb_1x_62d9b149.webp`,
    },
  },
  rear_delt_raise: {
    frame1: {
      mobile_2x: `${CDN}/rear_delt_raise_frame1_mobile_2x_37c2e294.webp`,
      mobile_1x: `${CDN}/rear_delt_raise_frame1_mobile_1x_effbf48d.webp`,
      thumb_2x:  `${CDN}/rear_delt_raise_frame1_thumb_2x_9ddbbb9e.webp`,
      thumb_1x:  `${CDN}/rear_delt_raise_frame1_thumb_1x_32a29347.webp`,
    },
    frame2: {
      mobile_2x: `${CDN}/rear_delt_raise_frame2_mobile_2x_a9b7501b.webp`,
      mobile_1x: `${CDN}/rear_delt_raise_frame2_mobile_1x_ce62519c.webp`,
      thumb_2x:  `${CDN}/rear_delt_raise_frame2_thumb_2x_ca145109.webp`,
      thumb_1x:  `${CDN}/rear_delt_raise_frame2_thumb_1x_1ce5ab84.webp`,
    },
  },
  renegade_row: {
    frame1: {
      mobile_2x: `${CDN}/renegade_row_frame1_mobile_2x_41b6b033.webp`,
      mobile_1x: `${CDN}/renegade_row_frame1_mobile_1x_059ea4ba.webp`,
      thumb_2x:  `${CDN}/renegade_row_frame1_thumb_2x_f99122fb.webp`,
      thumb_1x:  `${CDN}/renegade_row_frame1_thumb_1x_26adda03.webp`,
    },
    frame2: {
      mobile_2x: `${CDN}/renegade_row_frame2_mobile_2x_e2473426.webp`,
      mobile_1x: `${CDN}/renegade_row_frame2_mobile_1x_e1b80d8f.webp`,
      thumb_2x:  `${CDN}/renegade_row_frame2_thumb_2x_833a385a.webp`,
      thumb_1x:  `${CDN}/renegade_row_frame2_thumb_1x_51753140.webp`,
    },
  },
  scapular_pull_up: {
    frame1: {
      mobile_2x: `${CDN}/scapular_pull_up_frame1_mobile_2x_9f17bd58.webp`,
      mobile_1x: `${CDN}/scapular_pull_up_frame1_mobile_1x_b3f2a019.webp`,
      thumb_2x:  `${CDN}/scapular_pull_up_frame1_thumb_2x_f99e3eb5.webp`,
      thumb_1x:  `${CDN}/scapular_pull_up_frame1_thumb_1x_69dfa3c1.webp`,
    },
    frame2: {
      mobile_2x: `${CDN}/scapular_pull_up_frame2_mobile_2x_806dccda.webp`,
      mobile_1x: `${CDN}/scapular_pull_up_frame2_mobile_1x_fba3e017.webp`,
      thumb_2x:  `${CDN}/scapular_pull_up_frame2_thumb_2x_fbabde51.webp`,
      thumb_1x:  `${CDN}/scapular_pull_up_frame2_thumb_1x_cef96c25.webp`,
    },
  },
  tricep_dip: {
    frame1: {
      mobile_2x: `${CDN}/tricep_dip_frame1_mobile_2x_cb30deb0.webp`,
      mobile_1x: `${CDN}/tricep_dip_frame1_mobile_1x_917b4aba.webp`,
      thumb_2x:  `${CDN}/tricep_dip_frame1_thumb_2x_4ced9c02.webp`,
      thumb_1x:  `${CDN}/tricep_dip_frame1_thumb_1x_733a9a28.webp`,
    },
    frame2: {
      mobile_2x: `${CDN}/tricep_dip_frame2_mobile_2x_2e215b6c.webp`,
      mobile_1x: `${CDN}/tricep_dip_frame2_mobile_1x_eac918b4.webp`,
      thumb_2x:  `${CDN}/tricep_dip_frame2_thumb_2x_e3cc63bc.webp`,
      thumb_1x:  `${CDN}/tricep_dip_frame2_thumb_1x_3e8be5a3.webp`,
    },
  },
  upright_row: {
    frame1: {
      mobile_2x: `${CDN}/upright_row_frame1_mobile_2x_9f657498.webp`,
      mobile_1x: `${CDN}/upright_row_frame1_mobile_1x_ecad0743.webp`,
      thumb_2x:  `${CDN}/upright_row_frame1_thumb_2x_bfc71e3a.webp`,
      thumb_1x:  `${CDN}/upright_row_frame1_thumb_1x_f7546271.webp`,
    },
    frame2: {
      mobile_2x: `${CDN}/upright_row_frame2_mobile_2x_c342b613.webp`,
      mobile_1x: `${CDN}/upright_row_frame2_mobile_1x_7b8356ab.webp`,
      thumb_2x:  `${CDN}/upright_row_frame2_thumb_2x_e3e63e64.webp`,
      thumb_1x:  `${CDN}/upright_row_frame2_thumb_1x_6345abc3.webp`,
    },
  },
  // kb_swing replaced above with E2 flat vector style (Run #022)
  // Note: single_arm_db_row is unilateral — see UNILATERAL_REAL below
};

// ─── Unilateral exercises with real images ───────────────────────────────────
// Each entry has separate left and right frame pairs.
// TODO: All entries below use placeholder URLs — replace with real CDN URLs
//       after generating left/right oriented animations via exercise-animation skill.
const UNILATERAL_REAL: Record<string, { left: ExerciseFramePair; right: ExerciseFramePair }> = {
  // ── Lower Body ──────────────────────────────────────────────────────────────
  split_squat: {
    // TODO: generate split_squat_left_frame1/2 and split_squat_right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  bulgarian_split_squat: {
    // TODO: generate bulgarian_split_squat_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  reverse_lunge: {
    // TODO: generate reverse_lunge_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  forward_lunge: {
    // TODO: generate forward_lunge_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  lateral_lunge: {
    // TODO: generate lateral_lunge_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  curtsy_lunge: {
    // TODO: generate curtsy_lunge_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  step_up: {
    // TODO: generate step_up_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  box_step_up: {
    // TODO: generate box_step_up_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  single_leg_glute_bridge: {
    // TODO: generate single_leg_glute_bridge_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  single_leg_rdl: {
    // TODO: generate single_leg_rdl_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  single_leg_calf_raise: {
    // TODO: generate single_leg_calf_raise_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  // ── Pull / Upper ────────────────────────────────────────────────────────────
  single_arm_db_row: {
    // TODO: generate single_arm_db_row_left_frame1/2 and _right_frame1/2
    // Note: currently has bilateral frames in old system — needs re-generation
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  concentration_curl: {
    // TODO: generate concentration_curl_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  // ── Core ────────────────────────────────────────────────────────────────────
  side_plank: {
    // TODO: generate side_plank_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  side_plank_reach: {
    // TODO: generate side_plank_reach_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  woodchopper: {
    // TODO: generate woodchopper_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  // ── Conditioning ────────────────────────────────────────────────────────────
  suitcase_carry: {
    // TODO: generate suitcase_carry_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
  skater_jump: {
    // TODO: generate skater_jump_left_frame1/2 and _right_frame1/2
    left:  placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
    right: placeholderPair(PLACEHOLDER_URL, PLACEHOLDER_URL),
  },
};

// ─── Fallback placeholder for bilateral exercises without real images ─────────
const BILATERAL_PLACEHOLDER: ExerciseFramePair = {
  frame1: BILATERAL_REAL.push_up.frame1,
  frame2: BILATERAL_REAL.push_up.frame2,
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get animation frames for an exercise.
 * @param exerciseId  The exercise_id string
 * @param side        'left' | 'right' — only used for unilateral exercises
 */
export function getExerciseFrames(exerciseId: string, side?: 'left' | 'right'): ExerciseFrames {
  // Unilateral path
  if (UNILATERAL_REAL[exerciseId]) {
    const entry = UNILATERAL_REAL[exerciseId];
    const resolvedSide = side ?? 'left'; // default to left if side not specified
    return {
      kind: 'unilateral',
      left: entry.left,
      right: entry.right,
      isPlaceholder: true, // all unilateral are placeholders until real art is generated
      // Convenience: expose the active side's frames as neutral for backwards compat
      ...{ neutral: entry[resolvedSide] },
    } as UnilateralFrames;
  }

  // Bilateral path
  if (BILATERAL_REAL[exerciseId]) {
    return { kind: 'bilateral', neutral: BILATERAL_REAL[exerciseId], isPlaceholder: false };
  }

  // Fallback placeholder
  return { kind: 'bilateral', neutral: BILATERAL_PLACEHOLDER, isPlaceholder: true };
}

/**
 * Get the active frame pair for rendering — handles both bilateral and unilateral.
 * For unilateral exercises, pass the current side.
 */
export function getActiveFramePair(exerciseId: string, side?: 'left' | 'right'): ExerciseFramePair {
  const frames = getExerciseFrames(exerciseId, side);
  if (frames.kind === 'unilateral') {
    return frames[side ?? 'left'];
  }
  return frames.neutral;
}

export function hasRealImage(exerciseId: string): boolean {
  return exerciseId in BILATERAL_REAL || exerciseId in UNILATERAL_REAL;
}

export function isUnilateralExercise(exerciseId: string): boolean {
  return exerciseId in UNILATERAL_REAL;
}

export const EXERCISES_WITH_IMAGES = [
  ...Object.keys(BILATERAL_REAL),
  ...Object.keys(UNILATERAL_REAL),
];

// Export raw maps for testing
export const BILATERAL_IMAGES = BILATERAL_REAL;
export const UNILATERAL_IMAGES = UNILATERAL_REAL;
