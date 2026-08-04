"use client";

// The little golfer teeing off — a stylized SVG character in a scene, whose
// swing + ball flight are triggered per beat by the ConceptDemo.

export function GolferScene({ swinging, flying }: { swinging: boolean; flying: boolean }) {
  return (
    <div className="scene">
      <div className="scene-sun" />
      <div
        className="scene-cloud"
        style={{ top: "16%", width: 60, height: 16, animationDuration: "28s" }}
      />
      <div
        className="scene-cloud"
        style={{ top: "26%", width: 40, height: 12, animationDuration: "38s", opacity: 0.75 }}
      />
      {/* rolling hills */}
      <div
        className="scene-hill"
        style={{ left: "-10%", width: "70%", height: 120, background: "#4f9a55" }}
      />
      <div
        className="scene-hill"
        style={{ right: "-15%", width: "80%", height: 150, background: "#3f8449" }}
      />

      {/* flag + hole */}
      <div className="scene-hole" />
      <div className="scene-flag-pole">
        <div className="scene-flag" />
      </div>

      {/* golfer */}
      <div className={`golfer ${swinging ? "is-swing" : ""}`} key={swinging ? "sw" : "idle"}>
        <svg viewBox="0 0 70 110" width="70" height="110" aria-hidden="true">
          {/* legs */}
          <rect x="27" y="72" width="7" height="23" rx="3.5" fill="#e7b78d" />
          <rect x="37" y="72" width="7" height="23" rx="3.5" fill="#e7b78d" />
          <ellipse cx="29" cy="96" rx="7" ry="3.5" fill="#12351f" />
          <ellipse cx="41" cy="96" rx="7" ry="3.5" fill="#12351f" />
          {/* shorts */}
          <rect x="25" y="60" width="21" height="16" rx="5" fill="#0B3D2E" />
          {/* polo */}
          <rect x="24" y="39" width="23" height="25" rx="8" fill="#C6F432" />
          {/* neck + head */}
          <rect x="32" y="32" width="7" height="9" fill="#e7b78d" />
          <circle cx="35.5" cy="26" r="10" fill="#f0c49a" />
          {/* cap */}
          <path d="M25 25 a10.5 10.5 0 0 1 21 0 z" fill="#0B3D2E" />
          <rect x="44" y="22.5" width="10" height="4" rx="2" fill="#0B3D2E" />
          {/* arms + club (the swinging group) */}
          <g className="club">
            <rect x="32.5" y="40" width="5.5" height="20" rx="2.7" fill="#f0c49a" />
            <rect
              x="34"
              y="56"
              width="3"
              height="36"
              rx="1.5"
              fill="#9aa0a8"
              transform="rotate(22 35.5 57)"
            />
            <rect
              x="47"
              y="86"
              width="11"
              height="5"
              rx="2"
              fill="#2b2f36"
              transform="rotate(22 35.5 57)"
            />
          </g>
        </svg>
      </div>

      {/* ball */}
      <div className={`ball ${flying ? "is-fly" : ""}`} key={flying ? "fly" : "rest"}>
        <div className="ball-x">
          <div className="ball-y">
            <div className="dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
