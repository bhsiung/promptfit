/**
 * Workout Renderer — Image Asset Mapping (v2)
 * Maps exercise_id to CDN URLs for 4 responsive sizes:
 *   mobile_2x  → 800px wide WebP (Retina mobile)
 *   mobile_1x  → 400px wide WebP (standard mobile)
 *   thumb_2x   → 200px wide WebP (Retina thumbnail)
 *   thumb_1x   → 100px wide WebP (standard thumbnail)
 *
 * 18 exercises have real illustrations; all others use push_up as placeholder.
 * Images that were 403 on CDN (arnold_press, assisted_pull_up) are excluded.
 */

const CDN = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663298408851/XyFvSN3VK3nvaXR5w2ESua';

export interface ExerciseFrameSet {
  mobile_2x: string;
  mobile_1x: string;
  thumb_2x: string;
  thumb_1x: string;
}

export interface ExerciseFrames {
  frame1: ExerciseFrameSet;
  frame2: ExerciseFrameSet;
  isPlaceholder: boolean;
}

// Exercises with real illustration frames (18 exercises, 72 WebP files)
const REAL_IMAGES: Record<string, { frame1: ExerciseFrameSet; frame2: ExerciseFrameSet }> = {
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
  single_arm_db_row: {
    frame1: {
      mobile_2x: `${CDN}/single_arm_db_row_frame1_mobile_2x_9ac31519.webp`,
      mobile_1x: `${CDN}/single_arm_db_row_frame1_mobile_1x_0ecebeca.webp`,
      thumb_2x:  `${CDN}/single_arm_db_row_frame1_thumb_2x_a0ee7e0f.webp`,
      thumb_1x:  `${CDN}/single_arm_db_row_frame1_thumb_1x_a9c6ce29.webp`,
    },
    frame2: {
      mobile_2x: `${CDN}/single_arm_db_row_frame2_mobile_2x_c9e40cc0.webp`,
      mobile_1x: `${CDN}/single_arm_db_row_frame2_mobile_1x_da065aac.webp`,
      thumb_2x:  `${CDN}/single_arm_db_row_frame2_thumb_2x_c824c2f4.webp`,
      thumb_1x:  `${CDN}/single_arm_db_row_frame2_thumb_1x_61bf027c.webp`,
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
  kb_swing: {
    frame1: {
      mobile_2x: `${CDN}/kb_swing_frame1_final_1a441e42.png`,
      mobile_1x: `${CDN}/kb_swing_frame1_final_1a441e42.png`,
      thumb_2x:  `${CDN}/kb_swing_frame1_final_1a441e42.png`,
      thumb_1x:  `${CDN}/kb_swing_frame1_final_1a441e42.png`,
    },
    frame2: {
      mobile_2x: `${CDN}/kb_swing_frame2_final_4c368110.png`,
      mobile_1x: `${CDN}/kb_swing_frame2_final_4c368110.png`,
      thumb_2x:  `${CDN}/kb_swing_frame2_final_4c368110.png`,
      thumb_1x:  `${CDN}/kb_swing_frame2_final_4c368110.png`,
    },
  },
};

// Placeholder: use push_up frames for exercises without real images
const PLACEHOLDER_FRAMES: { frame1: ExerciseFrameSet; frame2: ExerciseFrameSet } = {
  frame1: REAL_IMAGES.push_up.frame1,
  frame2: REAL_IMAGES.push_up.frame2,
};

export function getExerciseFrames(exerciseId: string): ExerciseFrames {
  if (REAL_IMAGES[exerciseId]) {
    return { ...REAL_IMAGES[exerciseId], isPlaceholder: false };
  }
  return { ...PLACEHOLDER_FRAMES, isPlaceholder: true };
}

export function hasRealImage(exerciseId: string): boolean {
  return exerciseId in REAL_IMAGES;
}

export const EXERCISES_WITH_IMAGES = Object.keys(REAL_IMAGES);

// Export the full map for testing
export const EXERCISE_IMAGES = REAL_IMAGES;
