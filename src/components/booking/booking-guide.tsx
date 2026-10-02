import { useId } from "react";

/** Decorative mascot; the adjacent note contains all customer guidance. */
export function BookingGuide({ message }: { message: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <aside className="booking-guide" aria-label="Booking guide">
      <div className="guide-character" aria-hidden="true">
        <svg viewBox="0 0 110 130" focusable="false">
          <defs>
            <linearGradient id={`sudsy-${id}`} x2="0" y2="1">
              <stop stopColor="#fff2aa" />
              <stop offset="1" stopColor="#edbb52" />
            </linearGradient>
          </defs>
          <ellipse
            cx="55"
            cy="119"
            rx="30"
            ry="5"
            fill="#223c4b"
            opacity=".1"
          />
          <g className="guide-body">
            <path
              d="M37 99L32 113H45L49 98M64 99L67 113H81L77 98"
              fill="#304853"
            />
            <path
              d="M29 113H46M67 113H84"
              stroke="#304853"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M30 71L16 79M82 69L94 59"
              stroke="#304853"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M11 76Q6 70 10 66L17 74Q13 64 18 64L23 75Q28 73 29 78L24 85Q18 88 12 82Z"
              fill="white"
              stroke="#c4dce3"
              strokeWidth="1.5"
            />
            <g className="guide-wave">
              <path
                d="M92 59Q87 50 90 47L97 54Q92 42 97 42L102 51Q104 44 108 48L107 60Q102 67 96 65Z"
                fill="white"
                stroke="#c4dce3"
                strokeWidth="1.5"
              />
            </g>
            <rect
              x="27"
              y="35"
              width="58"
              height="66"
              rx="20"
              fill={`url(#sudsy-${id})`}
              stroke="#e4b74c"
              strokeWidth="2"
            />
            <g fill="#d99d35" opacity=".3">
              <circle cx="36" cy="58" r="3" />
              <circle cx="73" cy="84" r="3" />
              <circle cx="41" cy="90" r="2" />
              <circle cx="76" cy="54" r="2" />
            </g>
            <path d="M28 42Q28 16 55 16Q80 16 81 39Z" fill="#ff3e63" />
            <path d="M27 40H86Q91 40 91 44Q91 48 84 48H30Z" fill="#e6244b" />
            <path
              d="M56 23L54 34H64L57 39"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="44" cy="65" r="4" fill="#304853" />
            <circle cx="68" cy="65" r="4" fill="#304853" />
            <circle cx="45" cy="64" r="1" fill="white" />
            <circle cx="69" cy="64" r="1" fill="white" />
            <ellipse
              cx="37"
              cy="75"
              rx="5"
              ry="3"
              fill="#ef8c69"
              opacity=".6"
            />
            <ellipse
              cx="76"
              cy="75"
              rx="5"
              ry="3"
              fill="#ef8c69"
              opacity=".6"
            />
            <path
              d="M47 77Q56 87 65 77"
              fill="none"
              stroke="#304853"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M34 29Q27 25 29 19Q31 12 39 16Q39 7 46 9Q52 10 51 18"
              fill="white"
              stroke="#d9edf1"
              strokeWidth="1.5"
            />
          </g>
          <g className="guide-bubbles" fill="#d2f0f6" stroke="#aedee8">
            <circle cx="15" cy="37" r="5" />
            <circle cx="91" cy="20" r="4" />
            <circle cx="21" cy="19" r="2" />
          </g>
        </svg>
      </div>
      <div className="guide-bubble">
        <span className="guide-name">
          Sudsy <span>Your detailing buddy</span>
        </span>
        <p>{message}</p>
      </div>
    </aside>
  );
}
