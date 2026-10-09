"use client";

import { motion } from "framer-motion";

type CharacterAnimationProps = {
  action?: "idle" | "run" | "throw";
};

export default function CharacterAnimation({
  action = "run",
}: CharacterAnimationProps) {
  const running = action === "run";
  const throwing = action === "throw";

  return (
    <div className="relative h-[360px] w-[240px]">
      {/* Shadow */}
      <motion.div
        className="absolute bottom-5 left-1/2 h-5 w-32 -translate-x-1/2 rounded-full bg-black/40"
        animate={
          running
            ? {
                scaleX: [1, 0.8, 1],
                opacity: [0.35, 0.2, 0.35],
              }
            : {}
        }
        transition={{
          duration: 0.45,
          repeat: Infinity,
        }}
      />

      {/* Character */}
      <motion.div
        className="absolute left-[60px] top-0 h-[320px] w-[120px]"
        animate={
          running
            ? {
                y: [0, -5, 0],
                rotate: [-1, 1, -1],
              }
            : {}
        }
        transition={{
          duration: 0.45,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* HEAD */}
        <motion.div
          className="absolute left-[35px] top-[10px] h-[58px] w-[58px] rounded-full border-[5px] border-white bg-[#151515]"
          animate={
            running
              ? {
                  rotate: [-2, 2, -2],
                }
              : {}
          }
          transition={{
            duration: 0.45,
            repeat: Infinity,
          }}
        >
          {/* Face */}
          <div className="absolute left-[17px] top-[21px] h-[5px] w-[5px] rounded-full bg-white" />

          <div className="absolute right-[17px] top-[21px] h-[5px] w-[5px] rounded-full bg-white" />

          <div className="absolute left-[21px] top-[36px] h-[3px] w-[15px] rounded-full bg-white/70" />
        </motion.div>

        {/* NECK */}
        <div className="absolute left-[57px] top-[65px] h-[15px] w-[8px] rounded-full bg-white" />

        {/* TORSO */}
        <motion.div
          className="absolute left-[38px] top-[75px] h-[95px] w-[44px] rounded-[18px] border-[5px] border-white bg-[#151515]"
          animate={
            running
              ? {
                  rotate: [-3, 3, -3],
                }
              : {}
          }
          transition={{
            duration: 0.45,
            repeat: Infinity,
          }}
          style={{
            transformOrigin: "center bottom",
          }}
        />

        {/* LEFT ARM */}
        <motion.div
          className="absolute left-[30px] top-[78px] h-[15px] w-[15px] rounded-full border-4 border-white bg-[#151515]"
          animate={
            throwing
              ? {
                  rotate: [30, 70, 100, 40],
                }
              : running
                ? {
                    rotate: [35, -35, 35],
                  }
                : {}
          }
          transition={{
            duration: throwing ? 1.2 : 0.45,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transformOrigin: "right center",
          }}
        >
          {/* Upper arm */}
          <motion.div
            className="absolute right-[7px] top-[2px] h-[16px] w-[55px] rounded-full border-4 border-white bg-[#151515]"
            animate={
              running
                ? {
                    rotate: [-15, 15, -15],
                  }
                : {}
            }
            transition={{
              duration: 0.45,
              repeat: Infinity,
            }}
            style={{
              transformOrigin: "right center",
            }}
          >
            {/* Forearm */}
            <motion.div
              className="absolute right-[-48px] top-[-2px] h-[16px] w-[55px] rounded-full border-4 border-white bg-[#151515]"
              animate={
                throwing
                  ? {
                      rotate: [-20, 20, -70, -10],
                    }
                  : running
                    ? {
                        rotate: [20, -20, 20],
                      }
                    : {}
              }
              transition={{
                duration: throwing ? 1.2 : 0.45,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                transformOrigin: "left center",
              }}
            >
              {/* Hand */}
              <div className="absolute right-[-8px] top-[-3px] h-[22px] w-[22px] rounded-full border-4 border-white bg-[#151515]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* RIGHT ARM / THROWING ARM */}
        <motion.div
          className="absolute left-[75px] top-[78px] h-[15px] w-[15px] rounded-full border-4 border-white bg-[#151515]"
          animate={
            throwing
              ? {
                  rotate: [-50, -100, -145, -20],
                }
              : running
                ? {
                    rotate: [-35, 35, -35],
                  }
                : {}
          }
          transition={{
            duration: throwing ? 1.2 : 0.45,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transformOrigin: "left center",
          }}
        >
          <motion.div
            className="absolute left-[7px] top-[-2px] h-[16px] w-[55px] rounded-full border-4 border-white bg-[#151515]"
            animate={
              throwing
                ? {
                    rotate: [-20, -25, 80, 20],
                  }
                : running
                  ? {
                      rotate: [20, -20, 20],
                    }
                  : {}
            }
            transition={{
              duration: throwing ? 1.2 : 0.45,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              transformOrigin: "left center",
            }}
          >
            <motion.div
              className="absolute left-[47px] top-[-2px] h-[16px] w-[50px] rounded-full border-4 border-white bg-[#151515]"
              animate={
                throwing
                  ? {
                      rotate: [20, 20, -70, -10],
                    }
                  : running
                    ? {
                        rotate: [-20, 20, -20],
                      }
                    : {}
              }
              transition={{
                duration: throwing ? 1.2 : 0.45,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                transformOrigin: "left center",
              }}
            >
              <div className="absolute right-[-9px] top-[-3px] h-[22px] w-[22px] rounded-full border-4 border-white bg-[#151515]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* LEFT LEG */}
        <motion.div
          className="absolute left-[42px] top-[157px] h-[20px] w-[20px] rounded-full border-4 border-white bg-[#151515]"
          animate={
            running
              ? {
                  rotate: [30, -35, 30],
                }
              : {}
          }
          transition={{
            duration: 0.45,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transformOrigin: "center top",
          }}
        >
          <motion.div
            className="absolute left-[3px] top-[10px] h-[75px] w-[18px] rounded-full border-4 border-white bg-[#151515]"
            animate={
              running
                ? {
                    rotate: [-30, 30, -30],
                  }
                : {}
            }
            transition={{
              duration: 0.45,
              repeat: Infinity,
            }}
            style={{
              transformOrigin: "center top",
            }}
          >
            <motion.div
              className="absolute left-[0px] top-[65px] h-[70px] w-[18px] rounded-full border-4 border-white bg-[#151515]"
              animate={
                running
                  ? {
                      rotate: [25, -25, 25],
                    }
                  : {}
              }
              transition={{
                duration: 0.45,
                repeat: Infinity,
              }}
              style={{
                transformOrigin: "center top",
              }}
            >
              {/* Shoe */}
              <div className="absolute bottom-[-8px] left-[-15px] h-[18px] w-[45px] rounded-full border-4 border-white bg-[#151515]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* RIGHT LEG */}
        <motion.div
          className="absolute left-[63px] top-[157px] h-[20px] w-[20px] rounded-full border-4 border-white bg-[#151515]"
          animate={
            running
              ? {
                  rotate: [-35, 30, -35],
                }
              : {}
          }
          transition={{
            duration: 0.45,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            transformOrigin: "center top",
          }}
        >
          <motion.div
            className="absolute left-[3px] top-[10px] h-[75px] w-[18px] rounded-full border-4 border-white bg-[#151515]"
            animate={
              running
                ? {
                    rotate: [30, -30, 30],
                  }
                : {}
            }
            transition={{
              duration: 0.45,
              repeat: Infinity,
            }}
            style={{
              transformOrigin: "center top",
            }}
          >
            <motion.div
              className="absolute left-[0px] top-[65px] h-[70px] w-[18px] rounded-full border-4 border-white bg-[#151515]"
              animate={
                running
                  ? {
                      rotate: [-25, 25, -25],
                    }
                  : {}
              }
              transition={{
                duration: 0.45,
                repeat: Infinity,
              }}
              style={{
                transformOrigin: "center top",
              }}
            >
              <div className="absolute bottom-[-8px] left-[-5px] h-[18px] w-[45px] rounded-full border-4 border-white bg-[#151515]" />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}