// The exercise demos the user has approved, keyed by exercises.id. Each one
// is a few key poses for the figure in engine.ts (where the hips, hands and
// feet go) plus how it moves between them. Exercises not listed here keep
// showing their picture until their motion is approved.
import type { ExerciseMotion } from "./engine";

export const EXERCISE_MOTIONS: Readonly<Record<string, ExerciseMotion>> = {
  SQ01: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3200,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      props: [
        {
          type: "chair",
          x1: 178,
          x2: 214,
          y: 142,
          y0: 101,
          y1: 133,
          box: [[178, 98], [214, 172]]
        }
      ],
      prints: { kind: "feet", gap: 15, turn: 0, label: "hipWidth" },
      thumbT: 0.5,
      poses: {
        up: { hip: [160, 101], lean: 0, footA: [160, 168], handA: [162, 104] },
        down: { hip: [184, 133], lean: 34, footA: [160, 168], handA: [114, 98], elbowA: [0, 1] }
      }
    }
  },
  SQ02: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 750,
      keys: [[0, "down"], [0.4, "air"], [0.75, "down"], [1, "down"]],
      thumbT: 0,
      poses: {
        down: { hip: [176, 121], lean: 22, footA: [160, 168], handA: [132, 108], elbowA: [0, 1] },
        air: { hip: [176, 109], lean: 18, footA: [162, 157], toeA: 120, handA: [134, 92], elbowA: [0, 1] }
      }
    }
  },
  SQ03: {
    main: {
      kind: "spec",
      view: "front",
      angle: "front",
      dur: 1900,
      keys: [[0, "squat"], [0.3, "squat"], [0.55, "star"], [0.8, "squat"], [1, "squat"]],
      thumbT: 0.55,
      poses: {
        squat: {
          hip: [160, 132],
          tl: 0.85,
          footA: [142, 168],
          footB: [178, 168],
          handA: [154, 108],
          handB: [166, 108],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        star: {
          hip: [160, 90],
          footA: [124, 150],
          footB: [196, 150],
          toeA: 120,
          toeB: 60,
          handA: [110, 22],
          handB: [210, 22],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        }
      }
    }
  },
  SQ04: {
    main: {
      kind: "spec",
      view: "front",
      angle: "front",
      dur: 3200,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      prints: { kind: "feet", gap: 9, turn: 0, label: "together" },
      thumbT: 0.5,
      poses: {
        up: {
          hip: [160, 101],
          hipw: 6,
          footA: [155, 168],
          footB: [165, 168],
          kneePtA: [154.5, 134.5],
          kneePtB: [165.5, 134.5],
          toeA: 175,
          toeB: 5,
          handA: [142, 104],
          handB: [178, 104]
        },
        down: {
          hip: [160, 136],
          hipw: 6,
          tl: 0.8,
          footA: [155, 168],
          footB: [165, 168],
          kneePtA: [150, 149],
          kneePtB: [170, 149],
          toeA: 175,
          toeB: 5,
          handA: [155, 108],
          handB: [165, 108],
          elbowA: [-1, 0.5],
          elbowB: [1, 0.5]
        }
      }
    }
  },
  SQ05: {
    main: {
      kind: "raw",
      view: "front",
      angle: "front",
      dur: 3200,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      prints: { kind: "feet", gap: 28, turn: 24, label: "wide" },
      thumbT: 0.5,
      poses: {
        up: {
          H: [160, 44],
          N: [160, 60],
          Sa: [147, 62],
          Sb: [173, 62],
          Ea: [141, 84],
          Eb: [179, 84],
          Wa: [139, 104],
          Wb: [181, 104],
          P: [160, 102],
          Ha: [151, 102],
          Hb: [169, 102],
          Ka: [141, 136],
          Kb: [179, 136],
          Fa: [131, 168],
          Fb: [189, 168],
          Ta: [124, 171],
          Tb: [196, 171]
        },
        down: {
          H: [160, 74],
          N: [160, 90],
          Sa: [147, 92],
          Sb: [173, 92],
          Ea: [138, 108],
          Eb: [182, 108],
          Wa: [156, 104],
          Wb: [164, 104],
          P: [160, 132],
          Ha: [150, 132],
          Hb: [170, 132],
          Ka: [122, 140],
          Kb: [198, 140],
          Fa: [130, 168],
          Fb: [190, 168],
          Ta: [123, 171],
          Tb: [197, 171]
        }
      },
      cam: [0, 10, 320],
      shadow: [160, 50],
      thumbBox: [92, 50, 136]
    }
  },
  SQ06: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 5200,
      keys: [[0, "stand"], [0.22, "sit"], [0.86, "sit"], [1, "stand"]],
      props: [
        {
          type: "wall",
          x: 184,
          w: 16,
          box: [[184, 20], [200, 172]]
        }
      ],
      thumbT: 0.5,
      poses: {
        stand: { hip: [176, 101], lean: 0, footA: [166, 168], handA: [178, 104] },
        sit: { hip: [176, 134], lean: 0, footA: [140, 168], kneeA: [-0.3, -1], handA: [150, 130], elbowA: [0, 1] }
      }
    }
  },
  SQ07: {
    main: [
      {
        kind: "spec",
        view: "side",
        angle: "side",
        dur: 6800,
        keys: [
          [0, "up"],
          [0.2, "down"],
          [0.3, "down"],
          [0.47, "up"],
          [0.53, "up"],
          [0.7, "down"],
          [0.8, "down"],
          [0.97, "up"],
          [1, "up"]
        ],
        props: [
          {
            type: "chair",
            x1: 180,
            x2: 216,
            y: 152,
            y0: 101,
            y1: 144,
            box: [[180, 108], [216, 172]]
          }
        ],
        prints: { kind: "feet", gap: 15, turn: 0, label: "hipWidth" },
        thumbT: 0.25,
        poses: {
          up: { hip: [160, 101], lean: 0, footA: [160, 168], handA: [162, 104] },
          down: { hip: [184, 144], lean: 55, footA: [160, 168], handA: [150, 165], elbowA: [0, 1], handB: [128, 118], elbowB: [0, 1] }
        }
      },
      {
        kind: "spec",
        view: "front",
        angle: "front",
        dur: 6800,
        keys: [
          [0, "up"],
          [0.2, "down"],
          [0.3, "down"],
          [0.47, "up"],
          [0.53, "up"],
          [0.7, "down"],
          [0.8, "down"],
          [0.97, "up"],
          [1, "up"]
        ],
        prints: { kind: "feet", gap: 15, turn: 0, label: "hipWidth" },
        thumbT: 0.25,
        poses: {
          up: {
            hip: [160, 101],
            footA: [151, 168],
            footB: [169, 168],
            kneePtA: [151, 134.5],
            kneePtB: [169, 134.5],
            handA: [140, 104],
            handB: [180, 104]
          },
          down: {
            hip: [160, 142],
            tl: 0.55,
            footA: [151, 168],
            footB: [169, 168],
            kneePtA: [147, 152],
            kneePtB: [173, 152],
            handA: [157, 165],
            elbowA: [-1, 0],
            handB: [176, 128],
            elbowB: [1, 0.3]
          }
        }
      }
    ]
  },
  SQ08: {
    main: {
      kind: "spec",
      view: "front",
      angle: "front",
      dur: 4400,
      keys: [
        [0, "center"],
        [0.18, "left"],
        [0.34, "left"],
        [0.5, "center"],
        [0.68, "right"],
        [0.84, "right"],
        [1, "center"]
      ],
      thumbT: 0.26,
      poses: {
        center: { hip: [160, 101], hipw: 6, footA: [155, 168], footB: [165, 168], handA: [154, 92], handB: [166, 92], elbowA: [-1, 0.6], elbowB: [1, 0.6] },
        left: {
          hip: [110, 127],
          hipw: 8,
          tl: 0.9,
          footA: [98, 168],
          footB: [170, 168],
          kneeA: [-1, -0.3],
          handA: [106, 98],
          handB: [116, 98],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        right: {
          hip: [210, 127],
          hipw: 8,
          tl: 0.9,
          footA: [150, 168],
          footB: [222, 168],
          kneeB: [1, -0.3],
          handA: [204, 98],
          handB: [214, 98],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        }
      }
    }
  },
  SQ09: {
    main: {
      kind: "spec",
      view: "front",
      look: "side",
      angle: "side",
      dur: 7200,
      keys: [
        [0, "up"],
        [0.16, "down"],
        [0.28, "down"],
        [0.42, "turnA"],
        [0.5, "turnA"],
        [0.58, "up"],
        [0.66, "down"],
        [0.78, "down"],
        [0.92, "turnB"],
        [0.97, "turnB"],
        [1, "up"]
      ],
      props: [
        {
          type: "chair",
          x1: 178,
          x2: 214,
          y: 142,
          y0: 101,
          y1: 133,
          box: [[178, 98], [214, 172]]
        }
      ],
      prints: { kind: "feet", gap: 16, turn: 0, label: "slightlyApart" },
      thumbT: 0.22,
      poses: {
        up: {
          shw: 1,
          hipw: 1,
          kneeA: [-1, 0],
          kneeB: [-1, 0],
          elbowA: [1, 0.4],
          elbowB: [1, 0.4],
          toeA: 165,
          toeB: 165,
          hip: [160, 101],
          lean: 0,
          footA: [160, 168],
          footB: [165, 166],
          handA: [162, 104],
          handB: [167, 102]
        },
        down: {
          shw: 1,
          hipw: 1,
          kneeA: [-1, 0],
          kneeB: [-1, 0],
          elbowA: [0, 1],
          elbowB: [0, 1],
          toeA: 165,
          toeB: 165,
          hip: [184, 133],
          lean: 34,
          footA: [160, 168],
          footB: [165, 166],
          handA: [114, 98],
          handB: [119, 96]
        },
        turnA: {
          shw: 13,
          hipw: 1,
          kneeA: [-1, 0],
          kneeB: [-1, 0],
          elbowA: [-1, 0],
          elbowB: [1, 0],
          toeA: 165,
          toeB: 165,
          hip: [160, 101],
          lean: 0,
          footA: [160, 168],
          footB: [165, 166],
          handA: [156, 82],
          handB: [164, 82]
        },
        turnB: {
          shw: -13,
          hipw: 1,
          kneeA: [-1, 0],
          kneeB: [-1, 0],
          elbowA: [1, 0],
          elbowB: [-1, 0],
          toeA: 165,
          toeB: 165,
          hip: [160, 101],
          lean: 0,
          footA: [160, 168],
          footB: [165, 166],
          handA: [164, 82],
          handB: [156, 82]
        }
      }
    }
  },
  SQ10: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 1300,
      keys: [[0, "crouch"], [0.3, "crouch"], [0.52, "air"], [0.74, "crouch"], [1, "crouch"]],
      props: [
        { type: "travel", dist: 70, from: 0.3, to: 0.74 }
      ],
      prints: { kind: "feet", gap: 16, turn: 0, label: "slightlyApart" },
      thumbT: 0.52,
      poses: {
        crouch: { hip: [170, 126], lean: 28, footA: [160, 168], handA: [186, 118], elbowA: [1, 0.2] },
        air: { hip: [164, 100], lean: 12, footA: [166, 152], toeA: 110, handA: [124, 62], elbowA: [0, 1] }
      }
    }
  },
  PU01: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3000,
      keys: [[0, "out"], [0.4, "in"], [0.55, "in"], [0.95, "out"], [1, "out"]],
      props: [
        {
          type: "wall",
          x: 80,
          w: 16,
          box: [[80, 20], [96, 172]]
        }
      ],
      prints: { kind: "hands", gap: 18, turn: 0, label: "shoulderWidth" },
      thumbT: 0.5,
      poses: {
        out: { hip: [155.3, 104.3], lean: 18, footA: [176, 168], handA: [98, 77.5], elbowPtA: [119.3, 71.2], handB: [98, 74.5], elbowPtB: [119.3, 68.2] },
        in: { hip: [142.5, 110], lean: 30, footA: [176, 168], handA: [98, 77.5], elbowPtA: [114, 94], handB: [98, 74.5], elbowPtB: [114, 91] }
      }
    }
  },
  PU02: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3000,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      props: [
        {
          type: "table",
          x1: 60,
          x2: 122,
          y: 122,
          box: [[60, 118], [122, 172]]
        }
      ],
      prints: { kind: "hands", gap: 18, turn: 0, label: "shoulderWidth" },
      thumbT: 0.5,
      poses: {
        up: { hip: [172.2, 118.2], lean: 42, footA: [217, 168], handA: [110, 118] },
        down: { hip: [164.2, 126.8], lean: 52, footA: [217, 168], handA: [110, 118], elbowA: [1, 1] }
      }
    }
  },
  PU03: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3000,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      mat: true,
      prints: { kind: "hands", gap: 18, turn: 0, label: "shoulderWidth" },
      thumbT: 0.5,
      poses: {
        up: {
          hip: [148.6, 142.9],
          lean: 54,
          kneePtA: [176, 163],
          footA: [209, 163],
          toeA: 15,
          kneePtB: [181, 161],
          footB: [214, 161],
          toeB: 15,
          handA: [115, 164]
        },
        down: {
          hip: [142.8, 155.4],
          lean: 77,
          kneePtA: [176, 163],
          footA: [209, 163],
          toeA: 15,
          kneePtB: [181, 161],
          footB: [214, 161],
          toeB: 15,
          handA: [115, 164],
          elbowA: [1, -1]
        }
      }
    }
  },
  PU04: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3000,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      mat: true,
      prints: { kind: "hands", gap: 18, turn: 0, label: "shoulderWidth" },
      thumbT: 0,
      poses: {
        up: { hip: [144.3, 135.7], lean: 65, footA: [205, 164], toeA: 120, handA: [106, 164] },
        down: { hip: [138.6, 155.4], lean: 82.6, footA: [205, 164], toeA: 120, handA: [106, 164], elbowA: [1, -1] }
      }
    }
  },
  PU05: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3000,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      mat: true,
      prints: { kind: "hands", gap: 30, turn: 10, label: "wide" },
      thumbT: 0,
      poses: {
        up: { hip: [144.3, 135.7], lean: 65, footA: [205, 164], toeA: 120, handA: [106, 164] },
        down: { hip: [138.6, 155.4], lean: 82.6, footA: [205, 164], toeA: 120, handA: [106, 164], elbowA: [1, -1] }
      }
    },
    alt: {
      kind: "raw",
      view: "front",
      angle: "front",
      dur: 3000,
      keys: [[0, "up"], [0.42, "down"], [0.55, "down"], [0.95, "up"], [1, "up"]],
      mat: true,
      thumbT: 0,
      poses: {
        up: {
          H: [160, 108],
          N: [160, 124],
          Sa: [140, 127],
          Sb: [180, 127],
          Ea: [126, 147],
          Eb: [194, 147],
          Wa: [112, 166],
          Wb: [208, 166],
          P: [160, 134],
          Ha: [160, 134],
          Hb: [160, 134],
          Ka: [160, 134],
          Kb: [160, 134],
          Fa: [160, 134],
          Fb: [160, 134],
          Ta: [160, 134],
          Tb: [160, 134]
        },
        down: {
          H: [160, 134],
          N: [160, 148],
          Sa: [138, 151],
          Sb: [182, 151],
          Ea: [114, 153],
          Eb: [206, 153],
          Wa: [112, 166],
          Wb: [208, 166],
          P: [160, 156],
          Ha: [160, 156],
          Hb: [160, 156],
          Ka: [160, 156],
          Kb: [160, 156],
          Fa: [160, 156],
          Fb: [160, 156],
          Ta: [160, 156],
          Tb: [160, 156]
        }
      },
      cam: [56, 58, 208],
      shadow: [160, 60],
      thumbBox: [56, 58, 208]
    }
  },
  PU06: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3200,
      keys: [[0, "in"], [0.5, "out"], [1, "in"]],
      mat: true,
      prints: { kind: "hands", gap: 18, turn: 0, label: "shoulderWidth" },
      thumbT: 0,
      poses: {
        in: { hip: [144.3, 135.7], lean: 65, footA: [205, 164], toeA: 120, handA: [106, 164] },
        out: { hip: [144.3, 137], lean: 65.6, footA: [205, 164], toeA: 120, handA: [106, 164] }
      }
    }
  },
  PU07: {
    main: [
      {
        kind: "spec",
        view: "side",
        angle: "side",
        dur: 6400,
        keys: [
          [0, "up"],
          [0.15, "down"],
          [0.3, "up"],
          [0.4, "touchA"],
          [0.48, "touchA"],
          [0.55, "up"],
          [0.68, "down"],
          [0.8, "up"],
          [0.88, "touchB"],
          [0.95, "touchB"],
          [1, "up"]
        ],
        mat: true,
        props: [
          {
            type: "touch",
            layer: "front",
            at: ["N", "N"],
            when: [[0.37, 0.51], [0.85, 0.98]]
          }
        ],
        prints: { kind: "hands", gap: 18, turn: 0, label: "shoulderWidth" },
        thumbT: 0.44,
        poses: {
          up: { hip: [144.3, 135.7], lean: 65, footA: [205, 164], toeA: 120, handA: [106, 164], handB: [111, 162] },
          down: { hip: [138.6, 155.4], lean: 82.6, footA: [205, 164], toeA: 120, handA: [106, 164], elbowA: [1, -1], handB: [111, 162] },
          touchA: { hip: [144.3, 135.7], lean: 65, footA: [205, 164], toeA: 120, handA: [109, 122], elbowPtA: [124, 129], handB: [111, 162] },
          touchB: { hip: [144.3, 135.7], lean: 65, footA: [205, 164], toeA: 120, handA: [106, 164], handB: [112, 120], elbowPtB: [128, 127] }
        }
      },
      {
        kind: "spec",
        view: "front",
        angle: "front",
        dur: 6400,
        keys: [
          [0, "up"],
          [0.12, "down"],
          [0.24, "up"],
          [0.34, "touchA"],
          [0.42, "touchA"],
          [0.5, "up"],
          [0.62, "down"],
          [0.74, "up"],
          [0.84, "touchB"],
          [0.92, "touchB"],
          [1, "up"]
        ],
        props: [
          {
            type: "touch",
            layer: "front",
            at: ["Sb", "Sa"],
            when: [[0.31, 0.45], [0.81, 0.95]]
          }
        ],
        prints: { kind: "hands", gap: 18, turn: 0, label: "shoulderWidth" },
        thumbT: 0.38,
        poses: {
          up: {
            hip: [160, 128],
            tl: 0.286,
            shw: 20,
            hipw: 3,
            footA: [158, 131],
            footB: [162, 131],
            kneePtA: [158, 130],
            kneePtB: [162, 130],
            toeA: -90,
            toeB: -90,
            handA: [140, 164],
            elbowPtA: [140, 141],
            handB: [180, 164],
            elbowPtB: [180, 141]
          },
          down: {
            hip: [160, 150],
            tl: 0.286,
            shw: 20,
            hipw: 3,
            footA: [158, 153],
            footB: [162, 153],
            kneePtA: [158, 152],
            kneePtB: [162, 152],
            toeA: -90,
            toeB: -90,
            handA: [140, 164],
            elbowPtA: [143, 147],
            handB: [180, 164],
            elbowPtB: [177, 147]
          },
          touchA: {
            hip: [163, 126],
            tl: 0.286,
            shw: 20,
            hipw: 3,
            footA: [161, 129],
            footB: [165, 129],
            kneePtA: [161, 128],
            kneePtB: [165, 128],
            toeA: -90,
            toeB: -90,
            handA: [180, 120],
            elbowPtA: [160, 132],
            handB: [180, 164],
            elbowPtB: [181.5, 140]
          },
          touchB: {
            hip: [157, 126],
            tl: 0.286,
            shw: 20,
            hipw: 3,
            footA: [155, 129],
            footB: [159, 129],
            kneePtA: [155, 128],
            kneePtB: [159, 128],
            toeA: -90,
            toeB: -90,
            handA: [140, 164],
            elbowPtA: [138.5, 140],
            handB: [140, 120],
            elbowPtB: [160, 132]
          }
        }
      }
    ]
  },
  PU08: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 5600,
      keys: [[0, "up"], [0.6, "down"], [0.68, "down"], [0.9, "up"], [1, "up"]],
      mat: true,
      prints: { kind: "hands", gap: 18, turn: 0, label: "shoulderWidth" },
      thumbT: 0.3,
      poses: {
        up: { hip: [144.3, 135.7], lean: 65, footA: [205, 164], toeA: 120, handA: [106, 164] },
        down: { hip: [138.6, 155.4], lean: 82.6, footA: [205, 164], toeA: 120, handA: [106, 164], elbowA: [1, -1] }
      }
    }
  },
  PU09: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3000,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      mat: true,
      prints: { kind: "hands", gap: 9, turn: 0, label: "close" },
      thumbT: 0,
      poses: {
        up: { hip: [144.3, 135.7], lean: 65, footA: [205, 164], toeA: 120, handA: [118, 164] },
        down: { hip: [138.6, 155.4], lean: 82.6, footA: [205, 164], toeA: 120, handA: [118, 164], elbowA: [1, -0.4] }
      }
    }
  },
  PU10: {
    main: {
      kind: "spec",
      view: "front",
      look: "side",
      angle: "side",
      dur: 7000,
      keys: [
        [0, "up"],
        [0.12, "down"],
        [0.24, "up"],
        [0.36, "rotA"],
        [0.45, "rotA"],
        [0.55, "up"],
        [0.67, "down"],
        [0.79, "up"],
        [0.89, "rotB"],
        [0.96, "rotB"],
        [1, "up"]
      ],
      mat: true,
      prints: { kind: "hands", gap: 18, turn: 0, label: "shoulderWidth" },
      thumbT: 0.4,
      poses: {
        up: {
          hip: [144.3, 135.7],
          lean: 65,
          shw: 1,
          hipw: 1,
          footA: [205, 164],
          footB: [210, 162],
          toeA: 120,
          toeB: 120,
          kneeA: [0, -1],
          kneeB: [0, -1],
          handA: [106, 164],
          handB: [111, 162],
          elbowA: [1, -1],
          elbowB: [1, -1]
        },
        down: {
          hip: [138.6, 155.4],
          lean: 82.6,
          shw: 1,
          hipw: 1,
          footA: [205, 164],
          footB: [210, 162],
          toeA: 120,
          toeB: 120,
          kneeA: [0, -1],
          kneeB: [0, -1],
          handA: [106, 164],
          handB: [111, 162],
          elbowA: [1, -1],
          elbowB: [1, -1]
        },
        rotA: {
          hip: [149.1, 127.1],
          lean: 56.6,
          shw: -13,
          hipw: -8,
          footA: [210, 153],
          footB: [205, 164],
          toeA: 120,
          toeB: 120,
          kneeA: [0, -1],
          kneeB: [0, -1],
          handA: [121, 50],
          elbowA: [1, 0],
          handB: [107, 164],
          elbowB: [1, -1]
        },
        rotB: {
          hip: [149.1, 127.1],
          lean: 56.6,
          shw: 13,
          hipw: 8,
          footA: [205, 164],
          footB: [210, 153],
          toeA: 120,
          toeB: 120,
          kneeA: [0, -1],
          kneeB: [0, -1],
          handA: [107, 164],
          elbowA: [1, -1],
          handB: [121, 50],
          elbowB: [1, 0]
        }
      }
    }
  },
  BE01: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3200,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      thumbT: 0.5,
      poses: {
        up: { hip: [160, 101], lean: 0, footA: [160, 168], handA: [162, 104] },
        down: { hip: [168, 100], lean: 140, head: 15, footA: [160, 168], handA: [146, 167], elbowA: [-1, 0] }
      }
    }
  },
  BE02: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 5200,
      keys: [
        [0, "stand"],
        [0.2, "bend"],
        [0.3, "bend"],
        [0.5, "hold"],
        [0.6, "hold"],
        [0.8, "bend"],
        [0.9, "bend"],
        [1, "stand"]
      ],
      props: [
        {
          type: "ball",
          layer: "front",
          at: [128, 163],
          hold: [0.27, 0.83],
          box: [[120, 155], [136, 170]]
        }
      ],
      thumbT: 0.5,
      poses: {
        stand: { hip: [160, 101], lean: 0, footA: [160, 168], handA: [162, 104] },
        bend: { hip: [180, 132], lean: 75, head: -15, footA: [160, 168], handA: [130, 158], elbowA: [0, -1] },
        hold: { hip: [160, 101], lean: 0, footA: [160, 168], handA: [146, 94], elbowA: [1, 0.3] }
      }
    }
  },
  BE03: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3400,
      keys: [[0, "up"], [0.38, "down"], [0.62, "down"], [0.95, "up"], [1, "up"]],
      thumbT: 0.5,
      poses: {
        up: { hip: [160, 103], lean: 0, footA: [160, 168], handA: [162, 106] },
        down: { hip: [182, 108], lean: 75, head: -12, footA: [160, 168], handA: [141, 143], elbowA: [1, 0] }
      }
    }
  },
  BE04: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3600,
      keys: [[0, "down"], [0.35, "up"], [0.65, "up"], [0.95, "down"], [1, "down"]],
      mat: true,
      thumbT: 0.5,
      poses: {
        down: { hip: [138, 163], lean: 88, head: -10, footA: [188, 165], kneeA: [0, -1], toeA: 0, handA: [140, 166], elbowA: [0, 1] },
        up: { hip: [134, 147], lean: 109.5, head: -10, footA: [188, 165], kneeA: [0, -1], toeA: 0, handA: [140, 166], elbowA: [0, 1] }
      }
    }
  },
  BE05: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 6400,
      keys: [
        [0, "downA"],
        [0.18, "upA"],
        [0.32, "upA"],
        [0.45, "downA"],
        [0.55, "downB"],
        [0.68, "upB"],
        [0.82, "upB"],
        [0.95, "downB"],
        [1, "downA"]
      ],
      mat: true,
      thumbT: 0.25,
      poses: {
        downA: {
          hip: [138, 163],
          lean: 88,
          head: -10,
          footA: [188, 165],
          kneeA: [0, -1],
          toeA: 0,
          handA: [140, 166],
          elbowA: [0, 1],
          footB: [180, 116],
          toeB: 0
        },
        upA: {
          hip: [134, 147],
          lean: 109.5,
          head: -10,
          footA: [188, 165],
          kneeA: [0, -1],
          toeA: 0,
          handA: [140, 166],
          elbowA: [0, 1],
          footB: [197, 124],
          toeB: 0
        },
        downB: { hip: [138, 163], lean: 88, head: -10, footA: [181, 113], kneeA: [0, -1], toeA: 0, handA: [140, 166], elbowA: [0, 1], footB: [193, 163] },
        upB: { hip: [134, 147], lean: 109.5, head: -10, footA: [195, 126], kneeA: [0, -1], toeA: 0, handA: [140, 166], elbowA: [0, 1], footB: [193, 163] }
      }
    }
  },
  BE06: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 2800,
      keys: [[0, "down"], [0.35, "up"], [0.5, "up"], [0.85, "down"], [1, "down"]],
      mat: true,
      thumbT: 0.42,
      poses: {
        down: { hip: [138, 163], lean: 88, head: -10, footA: [182, 165], kneeA: [0, -1], toeA: 0, handA: [140, 166], elbowA: [0, 1] },
        up: { hip: [138, 163], lean: 65, head: 15, footA: [182, 165], kneeA: [0, -1], toeA: 0, handA: [140, 140], elbowA: [0, 1] }
      }
    }
  },
  BE07: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 4600,
      keys: [[0, "base"], [0.2, "up"], [0.85, "up"], [1, "base"]],
      mat: true,
      thumbT: 0.5,
      poses: {
        base: { hip: [142, 162], lean: 88, head: -12, footA: [209, 163], toeA: 8, kneeA: [0, -1], handA: [55, 162], elbowA: [0, -1] },
        up: { hip: [142, 160], lean: 78, head: -14, footA: [207, 148], toeA: 8, kneeA: [0, -1], handA: [60, 136], elbowA: [0, -1] }
      }
    }
  },
  BE08: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3200,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      mat: true,
      thumbT: 0.5,
      poses: {
        up: { hip: [170, 160], lean: 0, footA: [104, 163], toeA: -90, kneeA: [0, -1], handA: [140, 152], elbowA: [1, 0] },
        down: { hip: [170, 160], lean: 70, head: 10, footA: [104, 163], toeA: -90, kneeA: [0, -1], handA: [100, 156], elbowA: [0, -1] }
      }
    }
  },
  BE09: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 2400,
      keys: [[0, "sit"], [0.4, "back"], [0.55, "back"], [0.95, "sit"], [1, "sit"]],
      mat: true,
      thumbT: 0,
      poses: {
        sit: { hip: [160, 158], lean: -15, head: 10, footA: [128, 152], kneeA: [0, -1], toeA: 180, handA: [132, 130], elbowA: [0, 1] },
        back: { hip: [168, 150], lean: -75, head: 30, footA: [150, 118], kneeA: [-0.3, -1], toeA: 200, handA: [165, 122], elbowA: [0, -1] }
      }
    }
  },
  BE10: {
    main: {
      kind: "spec",
      view: "front",
      angle: "front",
      dur: 3400,
      keys: [[0, "up"], [0.4, "down"], [0.6, "down"], [0.95, "up"], [1, "up"]],
      mat: true,
      thumbT: 0.5,
      poses: {
        up: {
          hip: [160, 160],
          kneePtA: [118, 148],
          footA: [154, 165],
          kneePtB: [202, 148],
          footB: [166, 165],
          toeA: 0,
          toeB: 180,
          handA: [154, 160],
          handB: [166, 160],
          elbowA: [-1, 0.2],
          elbowB: [1, 0.2]
        },
        down: {
          hip: [160, 160],
          tl: 0.55,
          kneePtA: [118, 148],
          footA: [154, 165],
          kneePtB: [202, 148],
          footB: [166, 165],
          toeA: 0,
          toeB: 180,
          handA: [154, 160],
          handB: [166, 160],
          elbowA: [-1, 0.2],
          elbowB: [1, 0.2]
        }
      }
    }
  },
  MV01: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 1600,
      keys: [[0, "g0"], [0.25, "g1"], [0.5, "g2"], [0.75, "g3"], [1, "g0"]],
      linear: true,
      props: [
        { type: "travel", dist: 48 }
      ],
      thumbT: 0,
      poses: {
        g0: {
          hip: [164, 118],
          lean: 90,
          head: -8,
          kneeA: [-1, 0.4],
          kneeB: [-1, 0.4],
          elbowA: [1, 0],
          elbowB: [1, 0],
          toeA: 165,
          toeB: 165,
          handA: [108, 164],
          footB: [170, 164],
          handB: [134, 162],
          footA: [192, 166]
        },
        g1: {
          hip: [164, 118],
          lean: 90,
          head: -8,
          kneeA: [-1, 0.4],
          kneeB: [-1, 0.4],
          elbowA: [1, 0],
          elbowB: [1, 0],
          toeA: 165,
          toeB: 165,
          handA: [120, 164],
          footB: [182, 164],
          handB: [122, 152],
          footA: [180, 156]
        },
        g2: {
          hip: [164, 118],
          lean: 90,
          head: -8,
          kneeA: [-1, 0.4],
          kneeB: [-1, 0.4],
          elbowA: [1, 0],
          elbowB: [1, 0],
          toeA: 165,
          toeB: 165,
          handA: [132, 164],
          footB: [194, 164],
          handB: [110, 162],
          footA: [168, 166]
        },
        g3: {
          hip: [164, 118],
          lean: 90,
          head: -8,
          kneeA: [-1, 0.4],
          kneeB: [-1, 0.4],
          elbowA: [1, 0],
          elbowB: [1, 0],
          toeA: 165,
          toeB: 165,
          handA: [120, 154],
          footB: [182, 154],
          handB: [122, 162],
          footA: [180, 166]
        }
      }
    }
  },
  MV02: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 1500,
      keys: [[0, "crouch"], [0.3, "crouch"], [0.55, "air"], [0.8, "crouch"], [1, "crouch"]],
      props: [
        { type: "travel", dist: 80, from: 0.3, to: 0.8 }
      ],
      thumbT: 0.55,
      poses: {
        crouch: { hip: [172, 146], lean: 55, head: -20, footA: [170, 168], kneeA: [-1, -0.2], handA: [128, 164], elbowA: [1, 0] },
        air: { hip: [160, 104], lean: 35, head: -10, footA: [176, 150], toeA: 100, kneeA: [-1, 0], handA: [112, 74], elbowA: [0, 1] }
      }
    }
  },
  MV03: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 1800,
      keys: [[0, "g0"], [0.25, "g1"], [0.5, "g2"], [0.75, "g3"], [1, "g0"]],
      linear: true,
      props: [
        { type: "travel", dist: 32 }
      ],
      thumbT: 0,
      poses: {
        g0: {
          hip: [160, 146],
          lean: -50,
          head: 60,
          kneeA: [-0.3, -1],
          kneeB: [-0.3, -1],
          elbowA: [1, -0.2],
          elbowB: [1, -0.2],
          toeA: 180,
          toeB: 180,
          handA: [196, 164],
          footB: [114, 164],
          handB: [214, 162],
          footA: [128, 166]
        },
        g1: {
          hip: [160, 146],
          lean: -50,
          head: 60,
          kneeA: [-0.3, -1],
          kneeB: [-0.3, -1],
          elbowA: [1, -0.2],
          elbowB: [1, -0.2],
          toeA: 180,
          toeB: 180,
          handA: [204, 164],
          footB: [122, 164],
          handB: [206, 152],
          footA: [120, 156]
        },
        g2: {
          hip: [160, 146],
          lean: -50,
          head: 60,
          kneeA: [-0.3, -1],
          kneeB: [-0.3, -1],
          elbowA: [1, -0.2],
          elbowB: [1, -0.2],
          toeA: 180,
          toeB: 180,
          handA: [212, 164],
          footB: [130, 164],
          handB: [198, 162],
          footA: [112, 166]
        },
        g3: {
          hip: [160, 146],
          lean: -50,
          head: 60,
          kneeA: [-0.3, -1],
          kneeB: [-0.3, -1],
          elbowA: [1, -0.2],
          elbowB: [1, -0.2],
          toeA: 180,
          toeB: 180,
          handA: [204, 154],
          footB: [122, 154],
          handB: [206, 162],
          footA: [120, 166]
        }
      }
    }
  },
  MV04: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 1100,
      keys: [[0, "A"], [0.5, "B"], [1, "A"]],
      bounce: 3,
      thumbT: 0,
      poses: {
        A: {
          hip: [160, 102],
          lean: 4,
          footA: [128, 132],
          kneeA: [-1, -1],
          toeA: 150,
          footB: [162, 168],
          handA: [172, 98],
          elbowA: [1, 0.2],
          handB: [140, 70],
          elbowB: [0, 1]
        },
        B: {
          hip: [160, 102],
          lean: 4,
          footA: [162, 168],
          kneeA: [-1, 0],
          footB: [128, 132],
          kneeB: [-1, -1],
          toeB: 150,
          handA: [140, 70],
          elbowA: [0, 1],
          handB: [172, 98],
          elbowB: [1, 0.2]
        }
      }
    }
  },
  MV05: {
    main: {
      kind: "spec",
      view: "front",
      angle: "front",
      dur: 3600,
      keys: [
        [0, "s0"],
        [0.083333, "s1"],
        [0.166667, "s2"],
        [0.25, "s3"],
        [0.333333, "s4"],
        [0.416667, "s5"],
        [0.5, "s6"],
        [0.583333, "s7"],
        [0.666667, "s8"],
        [0.75, "s9"],
        [0.833333, "s10"],
        [0.916667, "s11"],
        [1, "s12"]
      ],
      thumbT: 0,
      poses: {
        s0: {
          hip: [190, 112],
          tl: 0.95,
          lean: 0,
          footA: [172, 168],
          footB: [208, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [182, 96],
          handB: [198, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s1: {
          hip: [180, 112],
          tl: 0.95,
          lean: 0,
          footA: [171, 168],
          footB: [189, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [172, 96],
          handB: [188, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s2: {
          hip: [170, 112],
          tl: 0.95,
          lean: 0,
          footA: [152, 168],
          footB: [188, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [162, 96],
          handB: [178, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s3: {
          hip: [160, 112],
          tl: 0.95,
          lean: 0,
          footA: [151, 168],
          footB: [169, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [152, 96],
          handB: [168, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s4: {
          hip: [150, 112],
          tl: 0.95,
          lean: 0,
          footA: [132, 168],
          footB: [168, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [142, 96],
          handB: [158, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s5: {
          hip: [140, 112],
          tl: 0.95,
          lean: 0,
          footA: [131, 168],
          footB: [149, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [132, 96],
          handB: [148, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s6: {
          hip: [130, 112],
          tl: 0.95,
          lean: 0,
          footA: [112, 168],
          footB: [148, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [122, 96],
          handB: [138, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s7: {
          hip: [140, 112],
          tl: 0.95,
          lean: 0,
          footA: [131, 168],
          footB: [149, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [132, 96],
          handB: [148, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s8: {
          hip: [150, 112],
          tl: 0.95,
          lean: 0,
          footA: [132, 168],
          footB: [168, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [142, 96],
          handB: [158, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s9: {
          hip: [160, 112],
          tl: 0.95,
          lean: 0,
          footA: [151, 168],
          footB: [169, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [152, 96],
          handB: [168, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s10: {
          hip: [170, 112],
          tl: 0.95,
          lean: 0,
          footA: [152, 168],
          footB: [188, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [162, 96],
          handB: [178, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s11: {
          hip: [180, 112],
          tl: 0.95,
          lean: 0,
          footA: [171, 168],
          footB: [189, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [172, 96],
          handB: [188, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        },
        s12: {
          hip: [190, 112],
          tl: 0.95,
          lean: 0,
          footA: [172, 168],
          footB: [208, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [182, 96],
          handB: [198, 96],
          elbowA: [-1, 0.6],
          elbowB: [1, 0.6]
        }
      }
    }
  },
  MV06: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 1000,
      keys: [[0, "A"], [0.5, "B"], [1, "A"]],
      bounce: 3,
      thumbT: 0,
      poses: {
        A: {
          hip: [160, 102],
          lean: 4,
          footA: [176, 106],
          kneeA: [0, 1],
          toeA: -40,
          footB: [162, 168],
          handA: [172, 98],
          elbowA: [1, 0.2],
          handB: [140, 70],
          elbowB: [0, 1]
        },
        B: {
          hip: [160, 102],
          lean: 4,
          footA: [162, 168],
          kneeA: [-1, 0],
          footB: [176, 106],
          kneeB: [0, 1],
          toeB: -40,
          handA: [140, 70],
          elbowA: [0, 1],
          handB: [172, 98],
          elbowB: [1, 0.2]
        }
      }
    }
  },
  MV07: {
    main: {
      kind: "spec",
      view: "front",
      angle: "above",
      dur: 2400,
      keys: [[0, "A"], [0.5, "B"], [1, "A"]],
      linear: true,
      props: [
        {
          type: "topdown",
          box: [[96, 14], [224, 184]]
        },
        { type: "travel", axis: "y", dist: 40, x1: 96, x2: 224 }
      ],
      thumbT: 0,
      poses: {
        A: {
          hip: [160, 112],
          toeA: 90,
          toeB: 90,
          elbowPtA: [130, 52],
          handA: [140, 28],
          elbowPtB: [186, 82],
          handB: [176, 62],
          kneePtA: [151.5, 144],
          footA: [152, 176],
          kneePtB: [200, 124],
          footB: [184, 154]
        },
        B: {
          hip: [160, 112],
          toeA: 90,
          toeB: 90,
          elbowPtA: [134, 82],
          handA: [144, 62],
          elbowPtB: [190, 52],
          handB: [180, 28],
          kneePtA: [120, 124],
          footA: [136, 154],
          kneePtB: [168.5, 144],
          footB: [168, 176]
        }
      }
    }
  },
  MV08: {
    main: {
      kind: "spec",
      view: "front",
      angle: "front",
      dur: 1100,
      keys: [[0, "closed"], [0.5, "open"], [1, "closed"]],
      thumbT: 0.5,
      poses: {
        closed: {
          hip: [160, 101],
          hipw: 6,
          footA: [155, 168],
          footB: [165, 168],
          toeA: 175,
          toeB: 5,
          handA: [146, 104],
          handB: [174, 104],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        open: {
          hip: [160, 94],
          footA: [126, 164],
          footB: [194, 164],
          toeA: 150,
          toeB: 30,
          handA: [128, 16],
          handB: [192, 16],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        }
      }
    }
  },
  MV09: {
    main: {
      kind: "spec",
      view: "front",
      angle: "front",
      dur: 4800,
      keys: [
        [0, "s0"],
        [0.083333, "s1"],
        [0.166667, "s2"],
        [0.25, "s3"],
        [0.333333, "s4"],
        [0.416667, "s5"],
        [0.5, "s6"],
        [0.583333, "s7"],
        [0.666667, "s8"],
        [0.75, "s9"],
        [0.833333, "s10"],
        [0.916667, "s11"],
        [1, "s12"]
      ],
      thumbT: 0,
      poses: {
        s0: {
          hip: [185, 112],
          tl: 0.95,
          lean: -5,
          footA: [172, 168],
          footB: [198, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [161, 114],
          handB: [209, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s1: {
          hip: [177, 112],
          tl: 0.95,
          lean: 5,
          footA: [170, 168],
          footB: [184, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [153, 114],
          handB: [201, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s2: {
          hip: [169, 112],
          tl: 0.95,
          lean: -5,
          footA: [156, 168],
          footB: [182, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [145, 114],
          handB: [193, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s3: {
          hip: [161, 112],
          tl: 0.95,
          lean: 5,
          footA: [154, 168],
          footB: [168, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [137, 114],
          handB: [185, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s4: {
          hip: [153, 112],
          tl: 0.95,
          lean: -5,
          footA: [140, 168],
          footB: [166, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [129, 114],
          handB: [177, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s5: {
          hip: [145, 112],
          tl: 0.95,
          lean: 5,
          footA: [138, 168],
          footB: [152, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [121, 114],
          handB: [169, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s6: {
          hip: [137, 112],
          tl: 0.95,
          lean: -5,
          footA: [124, 168],
          footB: [150, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [113, 114],
          handB: [161, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s7: {
          hip: [145, 112],
          tl: 0.95,
          lean: 5,
          footA: [138, 168],
          footB: [152, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [121, 114],
          handB: [169, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s8: {
          hip: [153, 112],
          tl: 0.95,
          lean: -5,
          footA: [140, 168],
          footB: [166, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [129, 114],
          handB: [177, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s9: {
          hip: [161, 112],
          tl: 0.95,
          lean: 5,
          footA: [154, 168],
          footB: [168, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [137, 114],
          handB: [185, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s10: {
          hip: [169, 112],
          tl: 0.95,
          lean: -5,
          footA: [156, 168],
          footB: [182, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [145, 114],
          handB: [193, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s11: {
          hip: [177, 112],
          tl: 0.95,
          lean: 5,
          footA: [170, 168],
          footB: [184, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [153, 114],
          handB: [201, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        },
        s12: {
          hip: [185, 112],
          tl: 0.95,
          lean: -5,
          footA: [172, 168],
          footB: [198, 168],
          kneeA: [-1, 0],
          kneeB: [1, 0],
          toeA: 160,
          toeB: 20,
          handA: [161, 114],
          handB: [209, 114],
          elbowA: [-1, 0],
          elbowB: [1, 0]
        }
      }
    }
  },
  MV10: {
    main: [
      {
        kind: "spec",
        view: "front",
        angle: "front",
        dur: 4000,
        keys: [
          [0, "L"],
          [0.075, "L"],
          [0.165, "air"],
          [0.25, "R"],
          [0.325, "R"],
          [0.415, "air"],
          [0.5, "L"],
          [0.575, "L"],
          [0.665, "air"],
          [0.75, "R"],
          [0.825, "R"],
          [0.915, "air"],
          [1, "L"]
        ],
        thumbT: 0,
        poses: {
          L: {
            hip: [122, 112],
            tl: 0.9,
            footA: [116, 168],
            kneePtA: [110, 140],
            footB: [132, 148],
            kneePtB: [134, 134],
            toeB: 90,
            handA: [92, 100],
            handB: [112, 116],
            elbowA: [-1, 0.3],
            elbowB: [1, 0.3]
          },
          air: {
            hip: [160, 96],
            footA: [150, 148],
            kneePtA: [152, 124],
            footB: [170, 148],
            kneePtB: [168, 124],
            toeA: 120,
            toeB: 60,
            handA: [150, 104],
            handB: [170, 104]
          },
          R: {
            hip: [198, 112],
            tl: 0.9,
            footB: [204, 168],
            kneePtB: [210, 140],
            footA: [188, 148],
            kneePtA: [186, 134],
            toeA: 90,
            handB: [228, 100],
            handA: [208, 116],
            elbowA: [-1, 0.3],
            elbowB: [1, 0.3]
          }
        }
      },
      {
        kind: "spec",
        view: "side",
        angle: "side",
        dur: 4000,
        keys: [
          [0, "L"],
          [0.075, "L"],
          [0.165, "air"],
          [0.25, "R"],
          [0.325, "R"],
          [0.415, "air"],
          [0.5, "L"],
          [0.575, "L"],
          [0.665, "air"],
          [0.75, "R"],
          [0.825, "R"],
          [0.915, "air"],
          [1, "L"]
        ],
        thumbT: 0,
        poses: {
          L: {
            hip: [160, 112],
            lean: 25,
            footA: [160, 168],
            footB: [196, 150],
            kneeB: [-0.3, 1],
            toeB: 40,
            handA: [178, 104],
            elbowA: [1, 0.3],
            handB: [124, 92],
            elbowB: [0, 1]
          },
          air: {
            hip: [160, 98],
            lean: 15,
            footA: [158, 150],
            footB: [166, 150],
            toeA: 110,
            toeB: 110,
            handA: [150, 104],
            handB: [156, 104],
            elbowA: [0, 1],
            elbowB: [0, 1]
          },
          R: {
            hip: [160, 112],
            lean: 25,
            footB: [165, 166],
            footA: [196, 150],
            kneeA: [-0.3, 1],
            toeA: 40,
            handA: [124, 92],
            elbowA: [0, 1],
            handB: [178, 104],
            elbowB: [1, 0.3]
          }
        }
      }
    ]
  },
  PL01: {
    main: {
      kind: "spec",
      view: "front",
      angle: "above",
      dur: 3400,
      keys: [[0, "ext"], [0.4, "pull"], [0.6, "pull"], [0.95, "ext"], [1, "ext"]],
      props: [
        {
          type: "topdown",
          x: 160,
          y1: 20,
          y2: 168,
          w: 104,
          box: [[108, 0], [212, 176]]
        }
      ],
      position: "belly",
      thumbT: 0.5,
      poses: {
        ext: {
          hip: [160, 93],
          footA: [152, 160],
          footB: [168, 160],
          toeA: 90,
          toeB: 90,
          elbowA: [-1, 0],
          elbowB: [1, 0],
          handA: [146, 8],
          elbowPtA: [146.5, 30.5],
          handB: [174, 8],
          elbowPtB: [173.5, 30.5]
        },
        pull: {
          hip: [160, 93],
          footA: [152, 160],
          footB: [168, 160],
          toeA: 90,
          toeB: 90,
          elbowA: [-1, 0],
          elbowB: [1, 0],
          handA: [134, 50],
          elbowPtA: [128, 72],
          handB: [186, 50],
          elbowPtB: [192, 72]
        }
      }
    }
  },
  PL02: {
    main: {
      kind: "oblique",
      view: "oblique",
      angle: "diagonal",
      dur: 7600,
      keys: [
        [0, "closed"],
        [0.06, "mid"],
        [0.12, "open"],
        [0.19, "lifted"],
        [0.34, "lifted"],
        [0.41, "open"],
        [0.45, "mid"],
        [0.5, "closed"],
        [0.56, "mid"],
        [0.62, "open"],
        [0.69, "lifted"],
        [0.84, "lifted"],
        [0.91, "open"],
        [0.95, "mid"],
        [1, "closed"]
      ],
      props: [
        { type: "mat3", x1: 50, x2: 232, z1: -66, z2: 66 }
      ],
      position: "belly",
      thumbT: 0.25,
      poses: {
        closed: {
          hip: [142, 6, 0],
          torso: [-1, 0, 0],
          headDir: [-1, 0.35, 0],
          footA: [209, 4, -9],
          footB: [209, 4, 9],
          kneeA: [0, 1, 0],
          kneeB: [0, 1, 0],
          toeA: [1, -0.3, 0],
          toeB: [1, -0.3, 0],
          handA: [144, 3, -15],
          handB: [144, 3, 15],
          elbowA: [0, 1, 0],
          elbowB: [0, 1, 0]
        },
        mid: {
          hip: [142, 6, 0],
          torso: [-1, 0, 0],
          headDir: [-1, 0.35, 0],
          footA: [209, 4, -9],
          footB: [209, 4, 9],
          kneeA: [0, 1, 0],
          kneeB: [0, 1, 0],
          toeA: [1, -0.3, 0],
          toeB: [1, -0.3, 0],
          handA: [131.1, 3, -44.1],
          handB: [131.1, 3, 44.1],
          elbowA: [0, 1, 0],
          elbowB: [0, 1, 0]
        },
        open: {
          hip: [142, 6, 0],
          torso: [-1, 0, 0],
          headDir: [-1, 0.35, 0],
          footA: [209, 4, -9],
          footB: [209, 4, 9],
          kneeA: [0, 1, 0],
          kneeB: [0, 1, 0],
          toeA: [1, -0.3, 0],
          toeB: [1, -0.3, 0],
          handA: [100, 3, -57],
          handB: [100, 3, 57],
          elbowA: [0, 1, 0],
          elbowB: [0, 1, 0]
        },
        lifted: {
          hip: [142, 7, 0],
          torso: [-1, 0.08, 0],
          headDir: [-1, 0.35, 0],
          footA: [209, 4, -9],
          footB: [209, 4, 9],
          kneeA: [0, 1, 0],
          kneeB: [0, 1, 0],
          toeA: [1, -0.3, 0],
          toeB: [1, -0.3, 0],
          handA: [100, 18, -55],
          handB: [100, 18, 55],
          elbowA: [0, 1, 0],
          elbowB: [0, 1, 0]
        }
      }
    }
  },
  PL03: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 1400,
      keys: [[0, "A"], [0.5, "B"], [1, "A"]],
      bounce: 2,
      thumbT: 0,
      poses: {
        A: {
          hip: [160, 101],
          footA: [141, 140],
          kneeA: [-1, -0.5],
          footB: [162, 168],
          elbowPtA: [172, 79],
          handA: [152, 81],
          elbowPtB: [158, 82],
          handB: [137, 80]
        },
        B: {
          hip: [160, 101],
          footA: [160, 168],
          kneeA: [-1, -0.5],
          footB: [143, 140],
          kneeB: [-1, -0.5],
          elbowPtA: [158, 82],
          handA: [137, 80],
          elbowPtB: [172, 79],
          handB: [152, 81]
        }
      }
    }
  },
  PL04: {
    main: {
      kind: "spec",
      view: "front",
      angle: "back",
      dur: 1700,
      keys: [[0, "A"], [0.5, "B"], [1, "A"]],
      props: [
        { type: "wallback" }
      ],
      thumbT: 0,
      poses: {
        A: { hip: [160, 101], footA: [151, 168], footB: [169, 168], handA: [138, 18], elbowA: [-1, 0.2], handB: [182, 60], elbowB: [1, 0.5] },
        B: { hip: [160, 101], footA: [151, 168], footB: [169, 168], handA: [138, 60], elbowA: [-1, 0.5], handB: [182, 18], elbowB: [1, 0.2] }
      }
    }
  },
  PL05: {
    main: [
      {
        kind: "oblique",
        view: "oblique",
        angle: "diagonal",
        dur: 7200,
        keys: [[0, "ext"], [0.15, "pull"], [0.35, "pull"], [0.5, "ext"], [0.65, "pull"], [0.85, "pull"], [1, "ext"]],
        props: [
          { type: "mat3", x1: 50, x2: 232, z1: -40, z2: 40 }
        ],
        position: "belly",
        thumbT: 0.25,
        poses: {
          ext: {
            hip: [146, 6, 0],
            torso: [-1, 0.35, 0],
            headDir: [-1, 0.35, 0],
            footA: [213, 4, -9],
            footB: [213, 4, 9],
            kneeA: [0, 1, 0],
            kneeB: [0, 1, 0],
            toeA: [1, -0.3, 0],
            toeB: [1, -0.3, 0],
            handA: [62, 30, -12],
            handB: [62, 30, 12],
            elbowA: [0, 1, 0],
            elbowB: [0, 1, 0]
          },
          pull: {
            hip: [146, 6, 0],
            torso: [-1, 0.35, 0],
            headDir: [-1, 0.35, 0],
            footA: [213, 4, -9],
            footB: [213, 4, 9],
            kneeA: [0, 1, 0],
            kneeB: [0, 1, 0],
            toeA: [1, -0.3, 0],
            toeB: [1, -0.3, 0],
            handA: [108, 26, -17],
            handB: [108, 26, 17],
            elbowA: [1, 0.2, -0.6],
            elbowB: [1, 0.2, 0.6]
          }
        }
      },
      {
        kind: "spec",
        view: "side",
        angle: "side",
        dur: 7200,
        keys: [[0, "ext"], [0.15, "pull"], [0.35, "pull"], [0.5, "ext"], [0.65, "pull"], [0.85, "pull"], [1, "ext"]],
        mat: true,
        position: "belly",
        thumbT: 0.25,
        poses: {
          ext: {
            hip: [146, 162],
            lean: 72,
            head: -8,
            footA: [213, 163],
            toeA: 8,
            kneeA: [0, -1],
            handA: [62, 140],
            elbowPtA: [83.1, 144.3],
            handB: [67, 138],
            elbowPtB: [88.1, 142.3]
          },
          pull: {
            hip: [146, 162],
            lean: 72,
            head: -8,
            footA: [213, 163],
            toeA: 8,
            kneeA: [0, -1],
            handA: [109, 137],
            elbowPtA: [128, 141],
            handB: [114, 135],
            elbowPtB: [133, 139]
          }
        }
      }
    ]
  },
  PL06: {
    main: {
      kind: "spec",
      view: "side",
      angle: "side",
      dur: 3200,
      keys: [[0, "reach"], [0.4, "pull"], [0.55, "pull"], [0.95, "reach"], [1, "reach"]],
      mat: true,
      thumbT: 0.5,
      poses: {
        reach: { hip: [160, 160], lean: 15, footA: [112, 166], kneeA: [0, -1], toeA: 180, handA: [104, 118], elbowA: [0.4, 1] },
        pull: { hip: [160, 160], lean: -8, footA: [100, 166], kneeA: [0, -1], toeA: 180, handA: [154, 125], elbowA: [0.4, 1] }
      }
    }
  },
  PL07: {
    main: {
      kind: "oblique",
      view: "oblique",
      angle: "diagonal",
      dur: 3400,
      keys: [[0, "Ar"], [0.22, "Ap"], [0.42, "Ar"], [0.5, "Br"], [0.72, "Bp"], [0.92, "Br"], [1, "Ar"]],
      props: [
        { type: "mat3", x1: 120, x2: 200, z1: -40, z2: 30, mat: false },
        {
          type: "touch",
          layer: "front",
          at: ["Ka", "Kb"],
          when: [[0.17, 0.29], [0.67, 0.79]]
        }
      ],
      thumbT: 0.22,
      poses: {
        Ar: {
          hip: [160, 67, 0],
          torso: [0, 1, 0],
          headDir: [0, 1, 0],
          side: [-0.8, 0, 0.6],
          footA: [167.2, 2, -5.4],
          footB: [152.8, 2, 5.4],
          kneeA: [-0.6, 0, -0.8],
          kneeB: [-0.6, 0, -0.8],
          toeA: [-0.6, 0, -0.8],
          toeB: [-0.6, 0, -0.8],
          elbowA: [0.3, -1, 0],
          elbowB: [0.3, -1, 0],
          handA: [168, 65, -11],
          elbowPtA: [169.2, 87, -9.4],
          handB: [149.6, 155, 7.8],
          elbowPtB: [149.6, 132, 7.8]
        },
        Ap: {
          hip: [160, 67, 0],
          torso: [-0.45, 1, -0.6],
          headDir: [0, 1, 0],
          side: [-0.8, 0, 0.6],
          footA: [142, 46, -32],
          footB: [152.8, 2, 5.4],
          kneeA: [-0.6, 0.3, -0.8],
          kneeB: [-0.6, 0, -0.8],
          toeA: [-0.6, 0, -0.8],
          toeB: [-0.6, 0, -0.8],
          elbowA: [0.3, -1, 0],
          elbowB: [0.3, -1, 0],
          handA: [158, 58, -30],
          elbowPtA: [156.6, 79.3, -29],
          handB: [144.7, 103.4, -21.5],
          elbowPtB: [144.7, 84, -26.4]
        },
        Br: {
          hip: [160, 67, 0],
          torso: [0, 1, 0],
          headDir: [0, 1, 0],
          side: [-0.8, 0, 0.6],
          footA: [167.2, 2, -5.4],
          footB: [152.8, 2, 5.4],
          kneeA: [-0.6, 0, -0.8],
          kneeB: [-0.6, 0, -0.8],
          toeA: [-0.6, 0, -0.8],
          toeB: [-0.6, 0, -0.8],
          elbowA: [0.3, -1, 0],
          elbowB: [0.3, -1, 0],
          handA: [170.4, 155, -7.8],
          elbowPtA: [170.4, 132, -7.8],
          handB: [147.2, 65, 4.6],
          elbowPtB: [148.4, 87, 6.2]
        },
        Bp: {
          hip: [160, 67, 0],
          torso: [-0.45, 1, -0.6],
          headDir: [0, 1, 0],
          side: [-0.8, 0, 0.6],
          footA: [167.2, 2, -5.4],
          footB: [137, 46, -29],
          kneeA: [-0.6, 0, -0.8],
          kneeB: [-0.6, 0.3, -0.8],
          toeA: [-0.6, 0, -0.8],
          toeB: [-0.6, 0, -0.8],
          elbowA: [0.3, -1, 0],
          elbowB: [0.3, -1, 0],
          handA: [139.1, 103.2, -17.5],
          elbowPtA: [139.1, 83.8, -22.4],
          handB: [132, 58, -14],
          elbowPtB: [133.2, 79.3, -13.2]
        }
      }
    }
  },
  PL08: {
    main: {
      kind: "oblique",
      view: "oblique",
      angle: "diagonal",
      dur: 3600,
      keys: [[0, "base"], [0.15, "liftA"], [0.35, "liftA"], [0.5, "base"], [0.65, "liftB"], [0.85, "liftB"], [1, "base"]],
      props: [
        { type: "mat3", x1: 40, x2: 232, z1: -40, z2: 40 }
      ],
      position: "belly",
      thumbT: 0.25,
      poses: {
        base: {
          hip: [142, 6, 0],
          torso: [-1, 0, 0],
          headDir: [-1, 0.35, 0],
          footA: [209, 4, -9],
          footB: [209, 4, 9],
          kneeA: [0, 1, 0],
          kneeB: [0, 1, 0],
          toeA: [1, -0.3, 0],
          toeB: [1, -0.3, 0],
          handA: [57, 3, -12],
          handB: [57, 3, 12],
          elbowA: [0, 1, 0],
          elbowB: [0, 1, 0]
        },
        liftA: {
          hip: [142, 6, 0],
          torso: [-1, 0, 0],
          headDir: [-1, 0.35, 0],
          footA: [209, 4, -9],
          footB: [207, 16, 9],
          kneeA: [0, 1, 0],
          kneeB: [0, 1, 0],
          toeA: [1, -0.3, 0],
          toeB: [1, -0.3, 0],
          handA: [58, 16, -12],
          handB: [57, 3, 12],
          elbowA: [0, 1, 0],
          elbowB: [0, 1, 0]
        },
        liftB: {
          hip: [142, 6, 0],
          torso: [-1, 0, 0],
          headDir: [-1, 0.35, 0],
          footA: [207, 16, -9],
          footB: [209, 4, 9],
          kneeA: [0, 1, 0],
          kneeB: [0, 1, 0],
          toeA: [1, -0.3, 0],
          toeB: [1, -0.3, 0],
          handA: [57, 3, -12],
          handB: [58, 16, 12],
          elbowA: [0, 1, 0],
          elbowB: [0, 1, 0]
        }
      }
    }
  },
  PL09: {
    main: {
      kind: "spec",
      view: "front",
      angle: "above",
      dur: 4000,
      keys: [[0, "down"], [0.22, "side"], [0.44, "up"], [0.56, "up"], [0.78, "side"], [1, "down"]],
      props: [
        {
          type: "topdown",
          x: 160,
          y1: 20,
          y2: 168,
          w: 104,
          box: [[108, 0], [212, 176]]
        }
      ],
      position: "belly",
      thumbT: 0.25,
      poses: {
        down: {
          hip: [160, 93],
          footA: [152, 160],
          footB: [168, 160],
          toeA: 90,
          toeB: 90,
          elbowA: [-1, 0],
          elbowB: [1, 0],
          handA: [137, 100],
          handB: [183, 100]
        },
        side: {
          hip: [160, 93],
          footA: [152, 160],
          footB: [168, 160],
          toeA: 90,
          toeB: 90,
          elbowA: [-1, 0],
          elbowB: [1, 0],
          handA: [102, 52],
          handB: [218, 52]
        },
        up: {
          hip: [160, 93],
          footA: [152, 160],
          footB: [168, 160],
          toeA: 90,
          toeB: 90,
          elbowA: [-1, 0],
          elbowB: [1, 0],
          handA: [140, 8],
          handB: [180, 8]
        }
      }
    }
  },
  PL10: {
    main: [
      {
        kind: "spec",
        view: "front",
        angle: "front",
        dur: 6400,
        keys: [
          [0, "up"],
          [0.2, "pull"],
          [0.3, "pull"],
          [0.47, "up"],
          [0.53, "up"],
          [0.7, "pull"],
          [0.8, "pull"],
          [0.97, "up"],
          [1, "up"]
        ],
        thumbT: 0.25,
        poses: {
          up: { hip: [160, 101], footA: [149, 168], footB: [171, 168], handA: [146, 14], handB: [174, 14], elbowA: [-1, 0], elbowB: [1, 0] },
          pull: { hip: [160, 112], footA: [149, 168], footB: [171, 168], handA: [138, 64], handB: [182, 64], elbowA: [-1, 0.5], elbowB: [1, 0.5] }
        }
      },
      {
        kind: "spec",
        view: "side",
        angle: "side",
        dur: 6400,
        keys: [
          [0, "up"],
          [0.2, "pull"],
          [0.3, "pull"],
          [0.47, "up"],
          [0.53, "up"],
          [0.7, "pull"],
          [0.8, "pull"],
          [0.97, "up"],
          [1, "up"]
        ],
        thumbT: 0.25,
        poses: {
          up: { hip: [160, 101], lean: 0, footA: [160, 168], handA: [164, 14], elbowPtA: [162, 36.5], handB: [169, 12], elbowPtB: [167, 34.5] },
          pull: {
            hip: [172, 112],
            lean: 12,
            footA: [160, 168],
            kneeA: [-1, 0],
            handA: [160, 72],
            elbowPtA: [166, 92],
            handB: [165, 70],
            elbowPtB: [171, 90]
          }
        }
      }
    ]
  }
};

export function motionFor(exerciseId: string): ExerciseMotion | null {
  return EXERCISE_MOTIONS[exerciseId] ?? null;
}
